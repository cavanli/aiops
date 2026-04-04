// AIops/backend/internal/service/deployment_service_test.go
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

func setupDeployServiceDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&model.DeploymentTemplate{}, &model.DeploymentTask{}, &model.Host{})
	return db
}

func TestDeploymentService_CreateTemplate(t *testing.T) {
	db := setupDeployServiceDB(t)
	templateRepo := repository.NewTemplateRepo(db)
	taskRepo := repository.NewTaskRepo(db)
	hostRepo := repository.NewHostRepo(db)
	cryptoSvc, _ := crypto.New("12345678901234567890123456789012")
	svc := NewDeploymentService(templateRepo, taskRepo, hostRepo, cryptoSvc)

	tmpl := &model.DeploymentTemplate{
		Name:          "test-deploy",
		ScriptType:    model.ScriptTypeShell,
		ScriptContent: "echo hello",
		CreatedBy:     1,
	}

	err := svc.CreateTemplate(tmpl)
	assert.NoError(t, err)
	assert.NotZero(t, tmpl.ID)
}
