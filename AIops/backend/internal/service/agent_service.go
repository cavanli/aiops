// internal/service/agent_service.go
package service

import (
	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
)

type AgentService struct {
	agentRepo *repository.AgentRepo
}

func NewAgentService(agentRepo *repository.AgentRepo) *AgentService {
	return &AgentService{agentRepo: agentRepo}
}

func (s *AgentService) CreateAgent(agent *model.Agent) error {
	return s.agentRepo.Create(agent)
}

func (s *AgentService) GetAgent(id uint) (*model.Agent, error) {
	return s.agentRepo.GetByID(id)
}

func (s *AgentService) ListAgents(offset, limit int) ([]*model.Agent, int64, error) {
	return s.agentRepo.List(offset, limit)
}

func (s *AgentService) UpdateAgent(agent *model.Agent) error {
	_, err := s.agentRepo.GetByID(agent.ID)
	if err != nil {
		return err
	}
	return s.agentRepo.Update(agent)
}

func (s *AgentService) DeleteAgent(id uint) error {
	return s.agentRepo.Delete(id)
}
