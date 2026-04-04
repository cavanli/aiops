// AIops/backend/internal/repository/task_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type TaskRepo struct {
	db *gorm.DB
}

func NewTaskRepo(db *gorm.DB) *TaskRepo {
	return &TaskRepo{db: db}
}

func (r *TaskRepo) Create(task *model.DeploymentTask) error {
	return r.db.Create(task).Error
}

func (r *TaskRepo) GetByID(id uint) (*model.DeploymentTask, error) {
	var task model.DeploymentTask
	err := r.db.First(&task, id).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *TaskRepo) List(offset, limit int) ([]*model.DeploymentTask, int64, error) {
	var tasks []*model.DeploymentTask
	var total int64
	if err := r.db.Model(&model.DeploymentTask{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&tasks).Error
	return tasks, total, err
}

func (r *TaskRepo) Update(task *model.DeploymentTask) error {
	return r.db.Save(task).Error
}
