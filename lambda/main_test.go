package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"strconv"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandlerRejectsUnsupportedMethod(t *testing.T) {
	h := &handler{}

	// GET and POST are routed; anything else is a 405.
	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		RequestContext: events.LambdaFunctionURLRequestContext{
			HTTP: events.LambdaFunctionURLRequestContextHTTPDescription{Method: "DELETE"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 405 {
		t.Fatalf("expected 405, got %d", resp.StatusCode)
	}
}

func TestHandlerServesChallenge(t *testing.T) {
	h := &handler{altchaSecret: []byte("test-secret")}

	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		RequestContext: events.LambdaFunctionURLRequestContext{
			HTTP: events.LambdaFunctionURLRequestContextHTTPDescription{Method: "GET"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var challenge altchaChallenge
	if err := json.Unmarshal([]byte(resp.Body), &challenge); err != nil {
		t.Fatalf("challenge body is not valid JSON: %v", err)
	}
	if challenge.Algorithm != altchaAlgorithm || challenge.Challenge == "" || challenge.Salt == "" || challenge.Signature == "" {
		t.Fatalf("incomplete challenge: %+v", challenge)
	}
}

// TestAltchaRoundTrip mints a challenge, solves it the way the browser widget
// would (brute-forcing the number), and confirms the handler accepts it.
func TestAltchaRoundTrip(t *testing.T) {
	h := &handler{altchaSecret: []byte("test-secret")}

	challenge, err := h.createChallenge()
	if err != nil {
		t.Fatalf("createChallenge failed: %v", err)
	}

	encoded := solveChallenge(t, challenge)
	// ddbClient is nil here, so claimChallenge fails open and the crypto checks
	// are what we are exercising.
	if !h.altchaVerified(context.Background(), encoded) {
		t.Fatal("expected a freshly solved challenge to verify")
	}
}

func TestAltchaRejectsTamperedSolution(t *testing.T) {
	h := &handler{altchaSecret: []byte("test-secret")}

	challenge, err := h.createChallenge()
	if err != nil {
		t.Fatalf("createChallenge failed: %v", err)
	}

	encoded := solveChallenge(t, challenge)
	raw, _ := base64.StdEncoding.DecodeString(encoded)
	var sol altchaSolution
	if err := json.Unmarshal(raw, &sol); err != nil {
		t.Fatalf("could not decode solution: %v", err)
	}
	sol.Number++ // wrong answer; no longer hashes to the challenge
	tampered, _ := json.Marshal(sol)

	if h.altchaVerified(context.Background(), base64.StdEncoding.EncodeToString(tampered)) {
		t.Fatal("expected a tampered solution to be rejected")
	}
}

func TestAltchaRejectsForgedSignature(t *testing.T) {
	// A challenge signed with a different secret must not verify here.
	signer := &handler{altchaSecret: []byte("attacker-secret")}
	verifier := &handler{altchaSecret: []byte("server-secret")}

	challenge, err := signer.createChallenge()
	if err != nil {
		t.Fatalf("createChallenge failed: %v", err)
	}

	encoded := solveChallenge(t, challenge)
	if verifier.altchaVerified(context.Background(), encoded) {
		t.Fatal("expected a foreign-signed challenge to be rejected")
	}
}

func TestHandlerRejectsMissingAltcha(t *testing.T) {
	// With a secret configured, an otherwise-valid POST without a solution fails.
	h := &handler{altchaSecret: []byte("test-secret")}

	resp, err := h.handle(context.Background(), events.LambdaFunctionURLRequest{
		Body: `{"email":"a@b.fi","acknowledged":true}`,
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

// solveChallenge mimics the widget: it finds the number n such that
// SHA-256(salt+n) equals the challenge hash, then base64-encodes the solution.
func solveChallenge(t *testing.T, c altchaChallenge) string {
	t.Helper()
	for n := int64(0); n <= c.MaxNumber; n++ {
		if sha256Hex(c.Salt+strconv.FormatInt(n, 10)) == c.Challenge {
			payload, err := json.Marshal(altchaSolution{
				Algorithm: c.Algorithm,
				Challenge: c.Challenge,
				Number:    n,
				Salt:      c.Salt,
				Signature: c.Signature,
			})
			if err != nil {
				t.Fatalf("could not marshal solution: %v", err)
			}
			return base64.StdEncoding.EncodeToString(payload)
		}
	}
	t.Fatal("no solution found within maxnumber")
	return ""
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
