// AIops/backend/internal/repository/model_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type ModelRepo struct {
	db *gorm.DB
}

func NewModelRepo(db *gorm.DB) *ModelRepo {
	return &ModelRepo{db: db}
}

func (r *ModelRepo) Create(m *model.AIModel) error {
	return r.db.Create(m).Error
}

func (r *ModelRepo) GetByID(id uint) (*model.AIModel, error) {
	var m model.AIModel
	err := r.db.First(&m, id).Error
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ModelRepo) List(offset, limit int) ([]*model.AIModel, int64, error) {
	var models []*model.AIModel
	var total int64
	if err := r.db.Model(&model.AIModel{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Offset(offset).Limit(limit).Find(&models).Error
	return models, total, err
}

func (r *ModelRepo) Update(m *model.AIModel) error {
	return r.db.Save(m).Error
}

func (r *ModelRepo) Delete(id uint) error {
	return r.db.Delete(&model.AIModel{}, id).Error
}
