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
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type submissionRequest struct {
	Value string `json:"value"`
}

type submissionItem struct {
	ID        string `dynamodbav:"id"`
	Value     string `dynamodbav:"value"`
	CreatedAt string `dynamodbav:"createdAt"`
}

type handler struct {
	tableName      string
	ddbClient      *dynamodb.Client
	allowedOrigins map[string]struct{}
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
		allowedOrigins: parseAllowedOrigins(os.Getenv("ALLOWED_ORIGINS")),
	}

	lambda.Start(h.handle)
}

func (h *handler) handle(ctx context.Context, req events.LambdaFunctionURLRequest) (events.LambdaFunctionURLResponse, error) {
	origin := req.Headers["origin"]
	if origin == "" {
		origin = req.Headers["Origin"]
	}
	corsHeaders := map[string]string{}
	if origin != "" {
		if _, ok := h.allowedOrigins[origin]; !ok {
			return jsonResponse(403, "origin is not allowed", nil), nil
		}
		corsHeaders["Access-Control-Allow-Origin"] = origin
		corsHeaders["Vary"] = "Origin"
	}

	if req.RequestContext.HTTP.Method == "OPTIONS" {
		return events.LambdaFunctionURLResponse{
			StatusCode: 204,
			Headers:    corsHeaders,
		}, nil
	}

	if req.RequestContext.HTTP.Method != "POST" {
		return jsonResponse(405, "method not allowed", corsHeaders), nil
	}

	body := req.Body
	if req.IsBase64Encoded {
		decodedBody, err := base64.StdEncoding.DecodeString(req.Body)
		if err != nil {
			return jsonResponse(400, "invalid request body", corsHeaders), nil
		}
		body = string(decodedBody)
	}

	var payload submissionRequest
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		return jsonResponse(400, "invalid request body", corsHeaders), nil
	}

	payload.Value = strings.TrimSpace(payload.Value)
	if payload.Value == "" {
		return jsonResponse(400, "value is required", corsHeaders), nil
	}
	if len(payload.Value) > 1024 {
		return jsonResponse(400, "value must be at most 1024 characters", corsHeaders), nil
	}

	id, err := randomID()
	if err != nil {
		log.Printf("failed to create id: %v", err)
		return jsonResponse(500, "internal server error", corsHeaders), nil
	}

	item, err := attributevalue.MarshalMap(submissionItem{
		ID:        id,
		Value:     payload.Value,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	})
	if err != nil {
		log.Printf("failed to marshal item: %v", err)
		return jsonResponse(500, "internal server error", corsHeaders), nil
	}

	_, err = h.ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &h.tableName,
		Item:      item,
	})
	if err != nil {
		log.Printf("failed to save item: %v", err)
		return jsonResponse(500, "internal server error", corsHeaders), nil
	}

	return events.LambdaFunctionURLResponse{
		StatusCode: 201,
		Headers:    corsHeaders,
		Body:       fmt.Sprintf(`{"id":"%s"}`, id),
	}, nil
}

func jsonResponse(code int, message string, headers map[string]string) events.LambdaFunctionURLResponse {
	if headers == nil {
		headers = map[string]string{}
	}
	headers["Content-Type"] = "application/json"
	return events.LambdaFunctionURLResponse{
		StatusCode: code,
		Headers:    headers,
		Body:       fmt.Sprintf(`{"message":%q}`, message),
	}
}

func randomID() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", errors.New("failed to read random bytes")
	}
	return hex.EncodeToString(buf), nil
}

func parseAllowedOrigins(value string) map[string]struct{} {
	origins := map[string]struct{}{}
	for _, origin := range strings.Split(value, ",") {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			origins[origin] = struct{}{}
		}
	}
	return origins
}
