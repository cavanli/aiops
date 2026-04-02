package crypto

import (
	"testing"
)

func TestEncryptDecrypt(t *testing.T) {
	svc, err := New("test-crypto-key-32-bytes-padding!")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	plaintext := "super-secret-api-key-12345"

	encrypted, err := svc.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("encrypt failed: %v", err)
	}

	if encrypted == plaintext {
		t.Error("encrypted text should differ from plaintext")
	}

	decrypted, err := svc.Decrypt(encrypted)
	if err != nil {
		t.Fatalf("decrypt failed: %v", err)
	}

	if decrypted != plaintext {
		t.Errorf("expected %q, got %q", plaintext, decrypted)
	}
}

func TestMaskSecret(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"sk-abc12345678", "sk-a**********"},
		{"short", "s****"},
		{"ab", "a*"},
	}

	for _, tt := range tests {
		got := MaskSecret(tt.input)
		if got != tt.expected {
			t.Errorf("MaskSecret(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}
