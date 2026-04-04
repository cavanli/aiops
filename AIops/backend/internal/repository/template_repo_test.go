// AIops/backend/internal/repository/template_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupDeployTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&model.DeploymentTemplate{}, &model.DeploymentTask{})
	return db
}

func TestTemplateRepo_Create(t *testing.T) {
	db := setupDeployTestDB(t)
	repo := NewTemplateRepo(db)

	tmpl := &model.DeploymentTemplate{
		Name:          "deploy-app",
		ScriptType:    model.ScriptTypeShell,
		ScriptContent: "echo 'deploying'",
		CreatedBy:     1,
	}

	err := repo.Create(tmpl)
	assert.NoError(t, err)
	assert.NotZero(t, tmpl.ID)
}
