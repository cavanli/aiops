// internal/service/host_group_service.go
package service

import (
	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
)

type HostGroupService struct {
	repo *repository.HostGroupRepo
}

func NewHostGroupService(repo *repository.HostGroupRepo) *HostGroupService {
	return &HostGroupService{repo: repo}
}

func (s *HostGroupService) CreateGroup(group *model.HostGroup) error {
	return s.repo.Create(group)
}

func (s *HostGroupService) GetGroup(id uint) (*model.HostGroup, error) {
	return s.repo.GetByID(id)
}

func (s *HostGroupService) ListGroups(offset, limit int) ([]*model.HostGroup, int64, error) {
	return s.repo.List(offset, limit)
}

func (s *HostGroupService) UpdateGroup(group *model.HostGroup) error {
	return s.repo.Update(group)
}

func (s *HostGroupService) DeleteGroup(id uint) error {
	return s.repo.Delete(id)
}
