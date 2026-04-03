// internal/repository/host_env_var_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type HostEnvVarRepo struct {
	db *gorm.DB
}

func NewHostEnvVarRepo(db *gorm.DB) *HostEnvVarRepo {
	return &HostEnvVarRepo{db: db}
}

func (r *HostEnvVarRepo) Create(envVar *model.HostEnvVar) error {
	return r.db.Create(envVar).Error
}

func (r *HostEnvVarRepo) ListByHostID(hostID uint) ([]*model.HostEnvVar, error) {
	var envVars []*model.HostEnvVar
	err := r.db.Where("host_id = ?", hostID).Find(&envVars).Error
	return envVars, err
}

func (r *HostEnvVarRepo) Delete(id uint) error {
	return r.db.Delete(&model.HostEnvVar{}, id).Error
}
