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
	tableName string
	ddbClient *dynamodb.Client
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
		tableName: tableName,
		ddbClient: dynamodb.NewFromConfig(cfg),
	}

	lambda.Start(h.handle)
}

func (h *handler) handle(ctx context.Context, req events.LambdaFunctionURLRequest) (events.LambdaFunctionURLResponse, error) {
	// CORS (allowed origins, preflight) is handled entirely by the Lambda
	// Function URL CORS configuration, so it is intentionally absent here.
	if req.RequestContext.HTTP.Method != "POST" {
		return jsonResponse(405, "method not allowed"), nil
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

	payload.Value = strings.TrimSpace(payload.Value)
	if payload.Value == "" {
		return jsonResponse(400, "value is required"), nil
	}
	if len(payload.Value) > 1024 {
		return jsonResponse(400, "value must be at most 1024 characters"), nil
	}

	id, err := randomID()
	if err != nil {
		log.Printf("failed to create id: %v", err)
		return jsonResponse(500, "internal server error"), nil
	}

	item, err := attributevalue.MarshalMap(submissionItem{
		ID:        id,
		Value:     payload.Value,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
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

func jsonResponse(code int, message string) events.LambdaFunctionURLResponse {
	return events.LambdaFunctionURLResponse{
		StatusCode: code,
		Headers:    map[string]string{"Content-Type": "application/json"},
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
