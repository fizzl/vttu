package main

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/mail"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

type submissionRequest struct {
	Email        string `json:"email"`
	Motivation   string `json:"motivation"`
	Acknowledged bool   `json:"acknowledged"`
	// Honeypot: a field that is hidden from real users via CSS. Bots that fill
	// every input will populate it; a non-empty value means the request is junk.
	Website string `json:"website"`
	// Altcha is the base64-encoded ALTCHA solution produced by the form widget.
	// The handler re-derives and verifies it before accepting the submission.
	// See doc/securing_the_lambda.md (Tier 1A).
	Altcha string `json:"altcha"`
}

// altchaChallenge is the JSON the GET endpoint hands the widget to solve. The
// fields and their JSON names match the ALTCHA protocol exactly.
type altchaChallenge struct {
	Algorithm string `json:"algorithm"`
	Challenge string `json:"challenge"`
	MaxNumber int64  `json:"maxnumber"`
	Salt      string `json:"salt"`
	Signature string `json:"signature"`
}

// altchaSolution is the decoded payload the widget returns: the original
// challenge plus the secret number it brute-forced.
type altchaSolution struct {
	Algorithm string `json:"algorithm"`
	Challenge string `json:"challenge"`
	Number    int64  `json:"number"`
	Salt      string `json:"salt"`
	Signature string `json:"signature"`
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

	// Tier 1A ALTCHA (see doc/securing_the_lambda.md). The widget brute-forces a
	// number in [0, altchaMaxNumber]; this sets the proof-of-work cost. One
	// million SHA-256 hashes is a fraction of a second on a real device but makes
	// mass spam expensive.
	altchaAlgorithm = "SHA-256"
	altchaMaxNumber = 1_000_000
	altchaSaltBytes = 12
	// How long a freshly minted challenge stays valid, and how long a solved one
	// is remembered for replay rejection. Long enough for a human to fill the
	// form, short enough to bound the replay-dedup table.
	altchaTTL = 10 * time.Minute
)

type handler struct {
	tableName string
	ddbClient *dynamodb.Client
	// Origin values accepted by the handler's belt-and-suspenders Origin check.
	// Empty means the check is disabled (fail open).
	allowedOrigins []string
	// HMAC key used to sign and verify ALTCHA challenges. Loaded once at cold
	// start from SSM and reused for the lifetime of the execution environment, so
	// warm invocations incur no extra reads. Empty means ALTCHA is disabled (fail
	// open), which only happens locally / in tests; production always sets it.
	altchaSecret []byte
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
		altchaSecret:   loadAltchaSecret(context.Background(), cfg),
	}

	lambda.Start(h.handle)
}

// loadAltchaSecret fetches the ALTCHA HMAC key from SSM Parameter Store once, at
// cold start. The result is cached on the handler for the lifetime of the
// execution environment, so warm invocations never re-read it. If the parameter
// name is unset the secret is empty and ALTCHA is disabled (local/dev); if it is
// set but unreadable we fail the cold start loudly rather than silently serving
// an unprotected endpoint.
func loadAltchaSecret(ctx context.Context, cfg aws.Config) []byte {
	paramName := os.Getenv("ALTCHA_SECRET_PARAM")
	if paramName == "" {
		log.Println("ALTCHA_SECRET_PARAM not set; ALTCHA verification disabled")
		return nil
	}

	withDecryption := true
	out, err := ssm.NewFromConfig(cfg).GetParameter(ctx, &ssm.GetParameterInput{
		Name:           &paramName,
		WithDecryption: &withDecryption,
	})
	if err != nil {
		log.Fatalf("failed to read ALTCHA secret %q from SSM: %v", paramName, err)
	}
	if out.Parameter == nil || out.Parameter.Value == nil || *out.Parameter.Value == "" {
		log.Fatalf("ALTCHA secret parameter %q is empty", paramName)
	}
	return []byte(*out.Parameter.Value)
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
	// Function URL CORS configuration, so it is intentionally absent here. The
	// endpoint serves two methods: GET hands the form's ALTCHA widget a fresh
	// signed challenge; POST accepts a submission (which must carry a solution).
	method := req.RequestContext.HTTP.Method
	if method != "GET" && method != "POST" {
		return jsonResponse(405, "method not allowed"), nil
	}

	// Tier 0: reject requests whose Origin header is not on the allowlist. This
	// is trivially spoofable but filters the low-effort scripts that do not
	// bother to set it. CORS already blocks other sites' browser JS; this also
	// stops the lazy curl caller. See doc/securing_the_lambda.md.
	if !h.originAllowed(req.Headers) {
		return jsonResponse(403, "forbidden"), nil
	}

	if method == "GET" {
		return h.handleChallenge(), nil
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

	// Tier 1A: require a valid, unexpired, single-use ALTCHA proof-of-work. This
	// is the real bot filter; the Tier 0 checks above only stop the laziest
	// abuse. See doc/securing_the_lambda.md.
	if !h.altchaVerified(ctx, payload.Altcha) {
		return jsonResponse(400, "challenge verification failed"), nil
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

// handleChallenge mints a fresh signed ALTCHA challenge for the widget to solve.
// Challenges are single-use and short-lived, so they must never be cached.
func (h *handler) handleChallenge() events.LambdaFunctionURLResponse {
	challenge, err := h.createChallenge()
	if err != nil {
		log.Printf("failed to create challenge: %v", err)
		return jsonResponse(500, "internal server error")
	}
	body, err := json.Marshal(challenge)
	if err != nil {
		log.Printf("failed to marshal challenge: %v", err)
		return jsonResponse(500, "internal server error")
	}
	return events.LambdaFunctionURLResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":  "application/json",
			"Cache-Control": "no-store",
		},
		Body: string(body),
	}
}

// createChallenge builds an ALTCHA challenge: a random salt (carrying an expiry),
// a secret number the client must find, the SHA-256 of salt+number that proves
// it found it, and our HMAC signature over that hash so we can trust a returned
// solution without storing any per-challenge state.
func (h *handler) createChallenge() (altchaChallenge, error) {
	saltBytes := make([]byte, altchaSaltBytes)
	if _, err := rand.Read(saltBytes); err != nil {
		return altchaChallenge{}, err
	}
	expires := time.Now().Add(altchaTTL).Unix()
	salt := fmt.Sprintf("%s?expires=%d", hex.EncodeToString(saltBytes), expires)

	n, err := rand.Int(rand.Reader, big.NewInt(altchaMaxNumber+1))
	if err != nil {
		return altchaChallenge{}, err
	}

	challenge := sha256Hex(salt + strconv.FormatInt(n.Int64(), 10))
	return altchaChallenge{
		Algorithm: altchaAlgorithm,
		Challenge: challenge,
		MaxNumber: altchaMaxNumber,
		Salt:      salt,
		Signature: hmacHex(h.altchaSecret, challenge),
	}, nil
}

// altchaVerified reports whether the base64-encoded solution is a valid,
// unexpired, single-use answer to a challenge this handler signed. When no
// secret is configured the check is disabled (returns true), mirroring the
// Origin allowlist's fail-open-when-unconfigured behaviour for local/tests.
func (h *handler) altchaVerified(ctx context.Context, encoded string) bool {
	if len(h.altchaSecret) == 0 {
		return true
	}

	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(encoded))
	if err != nil {
		return false
	}
	var sol altchaSolution
	if err := json.Unmarshal(raw, &sol); err != nil {
		return false
	}
	if sol.Algorithm != altchaAlgorithm || altchaExpired(sol.Salt) {
		return false
	}

	// Re-derive the challenge hash from the returned salt+number; if it matches,
	// the client really did the work. Then confirm our HMAC signature over that
	// hash, which proves we issued this challenge. Both use constant-time compare.
	expectedChallenge := sha256Hex(sol.Salt + strconv.FormatInt(sol.Number, 10))
	if !hmac.Equal([]byte(expectedChallenge), []byte(sol.Challenge)) {
		return false
	}
	if !hmac.Equal([]byte(hmacHex(h.altchaSecret, sol.Challenge)), []byte(sol.Signature)) {
		return false
	}

	// Replay protection: a solution may be redeemed only once. Without it a
	// botnet could amortise a single proof-of-work across many submissions.
	return h.claimChallenge(ctx, sol.Challenge)
}

// claimChallenge records a solved challenge so it cannot be reused, returning
// false if it was already claimed. It reuses the submissions table with a TTL so
// the dedup items reap themselves. Like the rate limiter it fails open: a
// DynamoDB hiccup must not block a legitimate applicant.
func (h *handler) claimChallenge(ctx context.Context, challenge string) bool {
	if h.ddbClient == nil {
		return true
	}

	expiresAt := strconv.FormatInt(time.Now().Add(altchaTTL).Unix(), 10)
	cond := "attribute_not_exists(id)"
	_, err := h.ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &h.tableName,
		Item: map[string]types.AttributeValue{
			"id":        &types.AttributeValueMemberS{Value: "altcha#" + challenge},
			"expiresAt": &types.AttributeValueMemberN{Value: expiresAt},
		},
		ConditionExpression: &cond,
	})
	if err != nil {
		var conflict *types.ConditionalCheckFailedException
		if errors.As(err, &conflict) {
			return false // already redeemed: this is a replay
		}
		log.Printf("altcha replay check failed: %v", err)
		return true // infra error: fail open
	}
	return true
}

// altchaExpired reports whether the salt's embedded expiry (the `expires` query
// param, a Unix timestamp) has passed. A salt with no expiry never expires; a
// malformed one is treated as expired.
func altchaExpired(salt string) bool {
	_, query, found := strings.Cut(salt, "?")
	if !found {
		return false
	}
	values, err := url.ParseQuery(query)
	if err != nil {
		return true
	}
	expires := values.Get("expires")
	if expires == "" {
		return false
	}
	ts, err := strconv.ParseInt(expires, 10, 64)
	if err != nil {
		return true
	}
	return time.Now().Unix() > ts
}

func sha256Hex(s string) string {
	sum := sha256.Sum256([]byte(s))
	return hex.EncodeToString(sum[:])
}

func hmacHex(key []byte, message string) string {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(message))
	return hex.EncodeToString(mac.Sum(nil))
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
