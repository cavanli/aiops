// internal/service/skill_service.go
package service

import (
	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
)

type SkillService struct {
	skillRepo *repository.SkillRepo
}

func NewSkillService(skillRepo *repository.SkillRepo) *SkillService {
	return &SkillService{skillRepo: skillRepo}
}

func (s *SkillService) CreateSkill(skill *model.Skill) error {
	return s.skillRepo.Create(skill)
}

func (s *SkillService) GetSkill(id uint) (*model.Skill, error) {
	return s.skillRepo.GetByID(id)
}

func (s *SkillService) ListSkills(offset, limit int, category string) ([]*model.Skill, int64, error) {
	return s.skillRepo.List(offset, limit, category)
}

func (s *SkillService) UpdateSkill(skill *model.Skill) error {
	_, err := s.skillRepo.GetByID(skill.ID)
	if err != nil {
		return err
	}
	return s.skillRepo.Update(skill)
}

func (s *SkillService) DeleteSkill(id uint) error {
	return s.skillRepo.Delete(id)
}
