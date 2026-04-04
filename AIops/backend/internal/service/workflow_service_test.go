// AIops/backend/internal/service/workflow_service_test.go
package service

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupWorkflowServiceDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&model.Workflow{}, &model.WorkflowExecution{})
	return db
}

func TestWorkflowService_CreateWorkflow(t *testing.T) {
	db := setupWorkflowServiceDB(t)
	wfRepo := repository.NewWorkflowRepo(db)
	execRepo := repository.NewExecutionRepo(db)
	svc := NewWorkflowService(wfRepo, execRepo)

	wf := &model.Workflow{
		Name:      "test-workflow",
		CreatedBy: 1,
	}

	err := svc.CreateWorkflow(wf)
	assert.NoError(t, err)
	assert.NotZero(t, wf.ID)
	assert.Equal(t, model.WorkflowStatusDraft, wf.Status)
}
