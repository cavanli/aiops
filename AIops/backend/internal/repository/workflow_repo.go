// AIops/backend/internal/repository/workflow_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type WorkflowRepo struct {
	db *gorm.DB
}

func NewWorkflowRepo(db *gorm.DB) *WorkflowRepo {
	return &WorkflowRepo{db: db}
}

func (r *WorkflowRepo) Create(wf *model.Workflow) error {
	return r.db.Create(wf).Error
}

func (r *WorkflowRepo) GetByID(id uint) (*model.Workflow, error) {
	var wf model.Workflow
	err := r.db.First(&wf, id).Error
	if err != nil {
		return nil, err
	}
	return &wf, nil
}

func (r *WorkflowRepo) List(offset, limit int) ([]*model.Workflow, int64, error) {
	var workflows []*model.Workflow
	var total int64
	if err := r.db.Model(&model.Workflow{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Offset(offset).Limit(limit).Find(&workflows).Error
	return workflows, total, err
}

func (r *WorkflowRepo) Update(wf *model.Workflow) error {
	return r.db.Save(wf).Error
}

func (r *WorkflowRepo) Delete(id uint) error {
	return r.db.Delete(&model.Workflow{}, id).Error
}
