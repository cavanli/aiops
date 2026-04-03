// internal/repository/host_group_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type HostGroupRepo struct {
	db *gorm.DB
}

func NewHostGroupRepo(db *gorm.DB) *HostGroupRepo {
	return &HostGroupRepo{db: db}
}

func (r *HostGroupRepo) Create(group *model.HostGroup) error {
	return r.db.Create(group).Error
}

func (r *HostGroupRepo) GetByID(id uint) (*model.HostGroup, error) {
	var group model.HostGroup
	err := r.db.First(&group, id).Error
	if err != nil {
		return nil, err
	}
	return &group, nil
}

func (r *HostGroupRepo) List(offset, limit int) ([]*model.HostGroup, int64, error) {
	var groups []*model.HostGroup
	var total int64

	if err := r.db.Model(&model.HostGroup{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Offset(offset).Limit(limit).Find(&groups).Error
	return groups, total, err
}

func (r *HostGroupRepo) Update(group *model.HostGroup) error {
	return r.db.Save(group).Error
}

func (r *HostGroupRepo) Delete(id uint) error {
	return r.db.Delete(&model.HostGroup{}, id).Error
}
