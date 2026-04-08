// internal/repository/agent_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type AgentRepo struct {
	db *gorm.DB
}

func NewAgentRepo(db *gorm.DB) *AgentRepo {
	return &AgentRepo{db: db}
}

func (r *AgentRepo) Create(agent *model.Agent) error {
	return r.db.Create(agent).Error
}

func (r *AgentRepo) GetByID(id uint) (*model.Agent, error) {
	var agent model.Agent
	err := r.db.First(&agent, id).Error
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

func (r *AgentRepo) List(offset, limit int) ([]*model.Agent, int64, error) {
	var agents []*model.Agent
	var total int64

	if err := r.db.Model(&model.Agent{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Offset(offset).Limit(limit).Find(&agents).Error
	return agents, total, err
}

func (r *AgentRepo) Update(agent *model.Agent) error {
	return r.db.Save(agent).Error
}

func (r *AgentRepo) Delete(id uint) error {
	return r.db.Delete(&model.Agent{}, id).Error
}
