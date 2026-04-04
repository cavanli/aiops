// AIops/backend/internal/repository/execution_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type ExecutionRepo struct {
	db *gorm.DB
}

func NewExecutionRepo(db *gorm.DB) *ExecutionRepo {
	return &ExecutionRepo{db: db}
}

func (r *ExecutionRepo) Create(exec *model.WorkflowExecution) error {
	return r.db.Create(exec).Error
}

func (r *ExecutionRepo) GetByID(id uint) (*model.WorkflowExecution, error) {
	var exec model.WorkflowExecution
	err := r.db.First(&exec, id).Error
	if err != nil {
		return nil, err
	}
	return &exec, nil
}

func (r *ExecutionRepo) ListByWorkflowID(workflowID uint, offset, limit int) ([]*model.WorkflowExecution, int64, error) {
	var execs []*model.WorkflowExecution
	var total int64
	if err := r.db.Model(&model.WorkflowExecution{}).Where("workflow_id = ?", workflowID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Where("workflow_id = ?", workflowID).Offset(offset).Limit(limit).Order("created_at DESC").Find(&execs).Error
	return execs, total, err
}

func (r *ExecutionRepo) Update(exec *model.WorkflowExecution) error {
	return r.db.Save(exec).Error
}
