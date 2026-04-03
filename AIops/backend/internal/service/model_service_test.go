// AIops/backend/internal/service/model_service_test.go
package service

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/crypto"
	"github.com/aiops/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupModelServiceDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&model.AIModel{}, &model.APIKey{})
	return db
}

func TestModelService_CreateModel(t *testing.T) {
	db := setupModelServiceDB(t)
	cryptoSvc, _ := crypto.New("12345678901234567890123456789012")
	modelRepo := repository.NewModelRepo(db)
	apiKeyRepo := repository.NewAPIKeyRepo(db)
	svc := NewModelService(modelRepo, apiKeyRepo, cryptoSvc)

	m := &model.AIModel{
		Name:      "gpt-4",
		Provider:  model.ModelProviderOpenAI,
		ModelType: model.ModelTypeChat,
	}

	err := svc.CreateModel(m)
	assert.NoError(t, err)
	assert.NotZero(t, m.ID)
	assert.Equal(t, model.ModelStatusActive, m.Status)
}

func TestModelService_CreateAPIKey_EncryptsKey(t *testing.T) {
	db := setupModelServiceDB(t)
	cryptoSvc, _ := crypto.New("12345678901234567890123456789012")
	modelRepo := repository.NewModelRepo(db)
	apiKeyRepo := repository.NewAPIKeyRepo(db)
	svc := NewModelService(modelRepo, apiKeyRepo, cryptoSvc)

	// Create parent model first
	m := &model.AIModel{Name: "test", Provider: model.ModelProviderOpenAI, ModelType: model.ModelTypeChat}
	modelRepo.Create(m)

	k := &model.APIKey{
		ModelID: m.ID,
		KeyName: "prod-key",
	}
	plainKey := "sk-test-1234567890"

	err := svc.CreateAPIKey(k, plainKey)
	assert.NoError(t, err)
	assert.NotZero(t, k.ID)
	assert.NotEqual(t, plainKey, k.EncryptedKey)
}
