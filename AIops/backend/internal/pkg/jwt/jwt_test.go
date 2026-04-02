package jwt

import (
	"testing"
	"time"
)

func TestGenerateAndParse_AccessToken(t *testing.T) {
	svc := New("test-secret-min-32-chars-padding!!", 15*time.Minute, 7*24*time.Hour)

	token, err := svc.GenerateAccessToken(1, "admin_user", "admin")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	claims, err := svc.ParseToken(token)
	if err != nil {
		t.Fatalf("unexpected parse error: %v", err)
	}

	if claims.UserID != 1 {
		t.Errorf("expected UserID 1, got %d", claims.UserID)
	}
	if claims.Username != "admin_user" {
		t.Errorf("expected username admin_user, got %s", claims.Username)
	}
	if claims.Role != "admin" {
		t.Errorf("expected role admin, got %s", claims.Role)
	}
}

func TestParseToken_InvalidToken(t *testing.T) {
	svc := New("test-secret-min-32-chars-padding!!", 15*time.Minute, 7*24*time.Hour)

	_, err := svc.ParseToken("invalid.token.here")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}
