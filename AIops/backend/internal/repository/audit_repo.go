// AIops/backend/internal/repository/audit_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type AuditRepo struct {
	db *gorm.DB
}

func NewAuditRepo(db *gorm.DB) *AuditRepo {
	return &AuditRepo{db: db}
}

func (r *AuditRepo) Create(log *model.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *AuditRepo) List(offset, limit int) ([]model.AuditLog, int64, error) {
	var logs []model.AuditLog
	var total int64
	if err := r.db.Model(&model.AuditLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := r.db.Order("created_at desc").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, 0, err
	}
	return logs, total, nil
}
