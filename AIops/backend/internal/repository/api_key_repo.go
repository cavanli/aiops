// AIops/backend/internal/repository/api_key_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type APIKeyRepo struct {
	db *gorm.DB
}

func NewAPIKeyRepo(db *gorm.DB) *APIKeyRepo {
	return &APIKeyRepo{db: db}
}

func (r *APIKeyRepo) Create(k *model.APIKey) error {
	return r.db.Create(k).Error
}

func (r *APIKeyRepo) GetByID(id uint) (*model.APIKey, error) {
	var k model.APIKey
	err := r.db.First(&k, id).Error
	if err != nil {
		return nil, err
	}
	return &k, nil
}

func (r *APIKeyRepo) ListByModelID(modelID uint, offset, limit int) ([]*model.APIKey, int64, error) {
	var keys []*model.APIKey
	var total int64
	if err := r.db.Model(&model.APIKey{}).Where("model_id = ?", modelID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Where("model_id = ?", modelID).Offset(offset).Limit(limit).Find(&keys).Error
	return keys, total, err
}

func (r *APIKeyRepo) Delete(id uint) error {
	return r.db.Delete(&model.APIKey{}, id).Error
}
