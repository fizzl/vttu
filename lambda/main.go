package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/mail"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type submissionRequest struct {
	Email        string `json:"email"`
	Motivation   string `json:"motivation"`
	Acknowledged bool   `json:"acknowledged"`
	// Honeypot: a field that is hidden from real users via CSS. Bots that fill
	// every input will populate it; a non-empty value means the request is junk.
	Website string `json:"website"`
}

type submissionItem struct {
	ID           string `dynamodbav:"id"`
	Email        string `dynamodbav:"email"`
	Motivation   string `dynamodbav:"motivation"`
	Acknowledged bool   `dynamodbav:"acknowledged"`
	CreatedAt    string `dynamodbav:"createdAt"`
}

const (
	maxEmailLength      = 320
	maxMotivationLength = 4096
	// Tier 0 abuse control: cap how many submissions a single source IP can make
	// per rolling hour. Generous for a real applicant, low enough to stop one
	// machine hammering the endpoint. See doc/securing_the_lambda.md.
	maxSubmissionsPerHour = 10
)

type handler struct {
	tableName string
	ddbClient *dynamodb.Client
	// Origin values accepted by the handler's belt-and-suspenders Origin check.
	// Empty means the check is disabled (fail open).
	allowedOrigins []string
}

func main() {
	tableName := os.Getenv("TABLE_NAME")
	if tableName == "" {
		log.Fatal("TABLE_NAME environment variable is required")
	}

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatalf("failed to load AWS config: %v", err)
	}

	h := &handler{
		tableName:      tableName,
		ddbClient:      dynamodb.NewFromConfig(cfg),
		allowedOrigins: parseOrigins(os.Getenv("ALLOWED_ORIGINS")),
	}

	lambda.Start(h.handle)
}

// parseOrigins splits a comma-separated ALLOWED_ORIGINS value into a trimmed,
// non-empty list.
func parseOrigins(raw string) []string {
	var origins []string
	for _, part := range strings.Split(raw, ",") {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}

func (h *handler) handle(ctx context.Context, req events.LambdaFunctionURLRequest) (events.LambdaFunctionURLResponse, error) {
	// CORS (allowed origins, preflight) is handled entirely by the Lambda
	// Function URL CORS configuration, so it is intentionally absent here.
	if req.RequestContext.HTTP.Method != "POST" {
		return jsonResponse(405, "method not allowed"), nil
	}

	// Tier 0: reject requests whose Origin header is not on the allowlist. This
	// is trivially spoofable but filters the low-effort scripts that do not
	// bother to set it. CORS already blocks other sites' browser JS; this also
	// stops the lazy curl caller. See doc/securing_the_lambda.md.
	if !h.originAllowed(req.Headers) {
		return jsonResponse(403, "forbidden"), nil
	}

	body := req.Body
	if req.IsBase64Encoded {
		decodedBody, err := base64.StdEncoding.DecodeString(req.Body)
		if err != nil {
			return jsonResponse(400, "invalid request body"), nil
		}
		body = string(decodedBody)
	}

	var payload submissionRequest
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		return jsonResponse(400, "invalid request body"), nil
	}

	// Tier 0 honeypot: real users never see the `website` field, so any value in
	// it marks the request as a bot. Reject with a generic error so the response
	// does not reveal the trap.
	if strings.TrimSpace(payload.Website) != "" {
		return jsonResponse(400, "invalid request body"), nil
	}

	payload.Email = strings.TrimSpace(payload.Email)
	payload.Motivation = strings.TrimSpace(payload.Motivation)

	if payload.Email == "" {
		return jsonResponse(400, "email is required"), nil
	}
	if len(payload.Email) > maxEmailLength || !validEmail(payload.Email) {
		return jsonResponse(400, "email is invalid"), nil
	}
	if len(payload.Motivation) > maxMotivationLength {
		return jsonResponse(400, "motivation is too long"), nil
	}
	if !payload.Acknowledged {
		return jsonResponse(400, "acknowledgement is required"), nil
	}

	// Tier 0 per-IP rate limit. Runs only for otherwise-valid submissions so a
	// flood of junk never reaches DynamoDB at all. Fails open: a counter error
	// must not block a legitimate applicant.
	exceeded, err := h.rateLimitExceeded(ctx, req.RequestContext.HTTP.SourceIP)
	if err != nil {
		log.Printf("rate limit check failed: %v", err)
	} else if exceeded {
		return jsonResponse(429, "too many requests"), nil
	}

	id, err := randomID()
	if err != nil {
		log.Printf("failed to create id: %v", err)
		return jsonResponse(500, "internal server error"), nil
	}

	item, err := attributevalue.MarshalMap(submissionItem{
		ID:           id,
		Email:        payload.Email,
		Motivation:   payload.Motivation,
		Acknowledged: payload.Acknowledged,
		CreatedAt:    time.Now().UTC().Format(time.RFC3339),
	})
	if err != nil {
		log.Printf("failed to marshal item: %v", err)
		return jsonResponse(500, "internal server error"), nil
	}

	_, err = h.ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &h.tableName,
		Item:      item,
	})
	if err != nil {
		log.Printf("failed to save item: %v", err)
		return jsonResponse(500, "internal server error"), nil
	}

	return events.LambdaFunctionURLResponse{
		StatusCode: 201,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       fmt.Sprintf(`{"id":"%s"}`, id),
	}, nil
}

// originAllowed reports whether the request's Origin header is on the allowlist.
// Lambda Function URL requests deliver header names in lowercase. When no
// allowlist is configured the check is disabled (returns true).
func (h *handler) originAllowed(headers map[string]string) bool {
	if len(h.allowedOrigins) == 0 {
		return true
	}
	origin := headers["origin"]
	for _, allowed := range h.allowedOrigins {
		if origin == allowed {
			return true
		}
	}
	return false
}

// rateLimitExceeded atomically increments an hourly counter for the source IP
// and reports whether it has passed the limit. The counter item carries a TTL so
// DynamoDB reaps it automatically. An empty IP cannot be rate limited and is let
// through.
func (h *handler) rateLimitExceeded(ctx context.Context, ip string) (bool, error) {
	if ip == "" || h.ddbClient == nil {
		return false, nil
	}

	now := time.Now().UTC()
	key := fmt.Sprintf("ratelimit#%s#%s", ip, now.Format("2006010215"))
	expiresAt := strconv.FormatInt(now.Add(2*time.Hour).Unix(), 10)
	updateExpr := "ADD #count :one SET #ttl = if_not_exists(#ttl, :ttl)"

	out, err := h.ddbClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: &h.tableName,
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: key},
		},
		UpdateExpression: &updateExpr,
		ExpressionAttributeNames: map[string]string{
			"#count": "count",
			"#ttl":   "expiresAt",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":one": &types.AttributeValueMemberN{Value: "1"},
			":ttl": &types.AttributeValueMemberN{Value: expiresAt},
		},
		ReturnValues: types.ReturnValueUpdatedNew,
	})
	if err != nil {
		return false, err
	}

	counter, ok := out.Attributes["count"].(*types.AttributeValueMemberN)
	if !ok {
		return false, nil
	}
	count, err := strconv.Atoi(counter.Value)
	if err != nil {
		return false, nil
	}
	return count > maxSubmissionsPerHour, nil
}

func jsonResponse(code int, message string) events.LambdaFunctionURLResponse {
	return events.LambdaFunctionURLResponse{
		StatusCode: code,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       fmt.Sprintf(`{"message":%q}`, message),
	}
}

func validEmail(value string) bool {
	addr, err := mail.ParseAddress(value)
	// Reject display-name forms like "Name <a@b.fi>"; require the bare address.
	return err == nil && addr.Address == value
}

func randomID() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", errors.New("failed to read random bytes")
	}
	return hex.EncodeToString(buf), nil
}
