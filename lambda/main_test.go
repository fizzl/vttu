package main

import (
"context"
"testing"

"github.com/aws/aws-lambda-go/events"
)

func TestParseAllowedOrigins(t *testing.T) {
origins := parseAllowedOrigins("https://vttu.fi, https://www.vttu.fi")

if len(origins) != 2 {
t.Fatalf("expected 2 origins, got %d", len(origins))
}

if _, ok := origins["https://vttu.fi"]; !ok {
t.Fatal("expected https://vttu.fi to be allowed")
}

if _, ok := origins["https://www.vttu.fi"]; !ok {
t.Fatal("expected https://www.vttu.fi to be allowed")
}
}

func TestHandlerRejectsDisallowedOrigin(t *testing.T) {
h := &handler{allowedOrigins: map[string]struct{}{"https://vttu.fi": {}}}

resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
Headers: map[string]string{"origin": "https://example.com"},
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

func TestHandlerReturnsPreflightForOptions(t *testing.T) {
h := &handler{allowedOrigins: map[string]struct{}{"https://vttu.fi": {}}}

resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
Headers: map[string]string{"origin": "https://vttu.fi"},
RequestContext: events.LambdaFunctionURLRequestContext{
HTTP: events.LambdaFunctionURLRequestContextHTTPDescription{Method: "OPTIONS"},
},
})
if err != nil {
t.Fatalf("unexpected error: %v", err)
}
if resp.StatusCode != 204 {
t.Fatalf("expected 204, got %d", resp.StatusCode)
}
}

func TestHandlerRejectsEmptyValue(t *testing.T) {
h := &handler{allowedOrigins: map[string]struct{}{"https://vttu.fi": {}}}

resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
Headers: map[string]string{"origin": "https://vttu.fi"},
Body:    `{"value":"   "}`,
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
