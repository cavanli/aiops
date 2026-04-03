// internal/repository/host_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupHostTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	err = db.AutoMigrate(&model.Host{})
	assert.NoError(t, err)
	return db
}

func TestHostRepo_Create(t *testing.T) {
	db := setupHostTestDB(t)
	repo := NewHostRepo(db)

	host := &model.Host{
		Name:    "test-host",
		IP:      "192.168.1.100",
		Port:    22,
		SSHUser: "root",
		SSHKey:  "encrypted-key",
		Status:  model.HostStatusUnknown,
		Env:     model.HostEnvDev,
	}

	err := repo.Create(host)
	assert.NoError(t, err)
	assert.NotZero(t, host.ID)
}
