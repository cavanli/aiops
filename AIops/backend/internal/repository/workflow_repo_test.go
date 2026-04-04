// AIops/backend/internal/repository/workflow_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupWorkflowTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	err = db.AutoMigrate(&model.Workflow{})
	assert.NoError(t, err)
	return db
}

func TestWorkflowRepo_Create(t *testing.T) {
	db := setupWorkflowTestDB(t)
	repo := NewWorkflowRepo(db)

	wf := &model.Workflow{
		Name:      "test-workflow",
		Status:    model.WorkflowStatusDraft,
		CreatedBy: 1,
	}

	err := repo.Create(wf)
	assert.NoError(t, err)
	assert.NotZero(t, wf.ID)
}
