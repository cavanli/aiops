// internal/service/host_service_test.go
package service

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/crypto"
	"github.com/aiops/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type MockSSHService struct {
	mock.Mock
}

func (m *MockSSHService) TestConnection(host string, port int, user, key string) error {
	args := m.Called(host, port, user, key)
	return args.Error(0)
}

type SSHServiceInterface interface {
	TestConnection(host string, port int, user, key string) error
}

func TestHostService_CreateHost(t *testing.T) {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&model.Host{})

	cryptoSvc, _ := crypto.New("12345678901234567890123456789012")
	hostRepo := repository.NewHostRepo(db)
	sshSvc := NewSSHService()
	svc := NewHostService(hostRepo, cryptoSvc, sshSvc)

	host := &model.Host{
		Name:    "test-host",
		IP:      "192.168.1.100",
		Port:    22,
		SSHUser: "root",
		SSHKey:  "plain-ssh-key",
	}

	err := svc.CreateHost(host)
	assert.NoError(t, err)
	assert.NotEqual(t, "plain-ssh-key", host.SSHKey)
}
