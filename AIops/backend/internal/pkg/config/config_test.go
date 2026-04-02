package config

import (
	"os"
	"testing"
)

func TestLoad_Defaults(t *testing.T) {
	os.Setenv("APP_PORT", "9090")
	os.Setenv("DB_HOST", "testhost")
	os.Setenv("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
	os.Setenv("CRYPTO_KEY", "test-crypto-key-32-bytes-padding!")

	cfg := Load()

	if cfg.App.Port != "9090" {
		t.Errorf("expected port 9090, got %s", cfg.App.Port)
	}
	if cfg.DB.Host != "testhost" {
		t.Errorf("expected db host testhost, got %s", cfg.DB.Host)
	}
}
