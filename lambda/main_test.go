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

func TestHandlerRejectsHoneypot(t *testing.T) {
	h := &handler{}

	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		Body: `{"email":"a@b.fi","acknowledged":true,"website":"http://spam.example"}`,
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

func TestHandlerRejectsDisallowedOrigin(t *testing.T) {
	h := &handler{allowedOrigins: []string{"https://vttu.fi"}}

	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		Body:    `{"email":"a@b.fi","acknowledged":true}`,
		Headers: map[string]string{"origin": "https://evil.example"},
		RequestContext: events.LambdaFunctionURLRequestContext{
			HTTP: events.LambdaFunctionURLRequestContextHTTPDescription{Method: "POST"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 403 {
		t.Fatalf("expected 403, got %d", resp.StatusCode)
	}
}

func TestHandlerAllowsConfiguredOrigin(t *testing.T) {
	h := &handler{allowedOrigins: []string{"https://vttu.fi"}}

	// A matching Origin passes the check, so the request proceeds to validation
	// and fails there (not on Origin), proving the allowlist let it through.
	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		Body:    `{"email":"not-an-email","acknowledged":true}`,
		Headers: map[string]string{"origin": "https://vttu.fi"},
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
