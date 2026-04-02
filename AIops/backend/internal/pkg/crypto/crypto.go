package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"strings"
)

type Service struct {
	block cipher.Block
}

func New(key string) (*Service, error) {
	k := []byte(key)
	if len(k) < 32 {
		return nil, fmt.Errorf("crypto key must be at least 32 bytes, got %d", len(k))
	}
	block, err := aes.NewCipher(k[:32])
	if err != nil {
		return nil, err
	}
	return &Service{block: block}, nil
}

func (s *Service) Encrypt(plaintext string) (string, error) {
	gcm, err := cipher.NewGCM(s.block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (s *Service) Decrypt(encoded string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(s.block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}

// MaskSecret shows a portion of the secret and masks the rest.
func MaskSecret(secret string) string {
	if len(secret) <= 1 {
		return secret
	}
	showCount := (len(secret) + 2) / 4
	if showCount < 1 {
		showCount = 1
	}
	return secret[:showCount] + strings.Repeat("*", len(secret)-showCount)
}
