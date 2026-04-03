// internal/repository/host_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type HostRepo struct {
	db *gorm.DB
}

func NewHostRepo(db *gorm.DB) *HostRepo {
	return &HostRepo{db: db}
}

func (r *HostRepo) Create(host *model.Host) error {
	return r.db.Create(host).Error
}

func (r *HostRepo) GetByID(id uint) (*model.Host, error) {
	var host model.Host
	err := r.db.First(&host, id).Error
	if err != nil {
		return nil, err
	}
	return &host, nil
}

func (r *HostRepo) List(offset, limit int) ([]*model.Host, int64, error) {
	var hosts []*model.Host
	var total int64

	if err := r.db.Model(&model.Host{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Offset(offset).Limit(limit).Find(&hosts).Error
	return hosts, total, err
}

func (r *HostRepo) Update(host *model.Host) error {
	return r.db.Save(host).Error
}

func (r *HostRepo) Delete(id uint) error {
	return r.db.Delete(&model.Host{}, id).Error
}
