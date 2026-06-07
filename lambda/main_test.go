package main

import (
	"context"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandlerRejectsNonPost(t *testing.T) {
	h := &handler{}

	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		RequestContext: events.LambdaFunctionURLRequestContext{
			HTTP: events.LambdaFunctionURLRequestContextHTTPDescription{Method: "GET"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 405 {
		t.Fatalf("expected 405, got %d", resp.StatusCode)
	}
}

func TestHandlerRejectsEmptyEmail(t *testing.T) {
	h := &handler{}

	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		Body: `{"email":"   ","acknowledged":true}`,
		RequestContext: events.LambdaFunctionURLRequestContext{
			HTTP: events.LambdaFunctionURLRequestContextHTTPDescription{Method: "POST"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestHandlerRejectsInvalidEmail(t *testing.T) {
	h := &handler{}

	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		Body: `{"email":"not-an-email","acknowledged":true}`,
		RequestContext: events.LambdaFunctionURLRequestContext{
			HTTP: events.LambdaFunctionURLRequestContextHTTPDescription{Method: "POST"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestHandlerRejectsUnacknowledged(t *testing.T) {
	h := &handler{}

	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		Body: `{"email":"a@b.fi","acknowledged":false}`,
		RequestContext: events.LambdaFunctionURLRequestContext{
			HTTP: events.LambdaFunctionURLRequestContextHTTPDescription{Method: "POST"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestHandlerRejectsInvalidBody(t *testing.T) {
	h := &handler{}

	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		Body: `not json`,
		RequestContext: events.LambdaFunctionURLRequestContext{
			HTTP: events.LambdaFunctionURLRequestContextHTTPDescription{Method: "POST"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}
