// AIops/backend/internal/repository/model_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupModelTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	err = db.AutoMigrate(&model.AIModel{})
	assert.NoError(t, err)
	return db
}

func TestModelRepo_Create(t *testing.T) {
	db := setupModelTestDB(t)
	repo := NewModelRepo(db)

	m := &model.AIModel{
		Name:      "gpt-4",
		Provider:  model.ModelProviderOpenAI,
		ModelType: model.ModelTypeChat,
		Status:    model.ModelStatusActive,
	}

	err := repo.Create(m)
	assert.NoError(t, err)
	assert.NotZero(t, m.ID)
}
