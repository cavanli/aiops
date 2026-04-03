// internal/service/ssh_service_test.go
package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSSHService_TestConnection(t *testing.T) {
	svc := NewSSHService()

	// Test with invalid host (should fail)
	err := svc.TestConnection("invalid-host", 22, "root", "fake-key")
	assert.Error(t, err)
}
