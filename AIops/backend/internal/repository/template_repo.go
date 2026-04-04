// AIops/backend/internal/repository/template_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type TemplateRepo struct {
	db *gorm.DB
}

func NewTemplateRepo(db *gorm.DB) *TemplateRepo {
	return &TemplateRepo{db: db}
}

func (r *TemplateRepo) Create(t *model.DeploymentTemplate) error {
	return r.db.Create(t).Error
}

func (r *TemplateRepo) GetByID(id uint) (*model.DeploymentTemplate, error) {
	var t model.DeploymentTemplate
	err := r.db.First(&t, id).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TemplateRepo) List(offset, limit int) ([]*model.DeploymentTemplate, int64, error) {
	var templates []*model.DeploymentTemplate
	var total int64
	if err := r.db.Model(&model.DeploymentTemplate{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Offset(offset).Limit(limit).Find(&templates).Error
	return templates, total, err
}

func (r *TemplateRepo) Update(t *model.DeploymentTemplate) error {
	return r.db.Save(t).Error
}

func (r *TemplateRepo) Delete(id uint) error {
	return r.db.Delete(&model.DeploymentTemplate{}, id).Error
}
