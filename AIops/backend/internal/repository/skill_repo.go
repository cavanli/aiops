// internal/repository/skill_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type SkillRepo struct {
	db *gorm.DB
}

func NewSkillRepo(db *gorm.DB) *SkillRepo {
	return &SkillRepo{db: db}
}

func (r *SkillRepo) Create(skill *model.Skill) error {
	return r.db.Create(skill).Error
}

func (r *SkillRepo) GetByID(id uint) (*model.Skill, error) {
	var skill model.Skill
	err := r.db.First(&skill, id).Error
	if err != nil {
		return nil, err
	}
	return &skill, nil
}

func (r *SkillRepo) List(offset, limit int, category string) ([]*model.Skill, int64, error) {
	var skills []*model.Skill
	var total int64

	q := r.db.Model(&model.Skill{})
	if category != "" {
		q = q.Where("category = ?", category)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := q.Offset(offset).Limit(limit).Find(&skills).Error
	return skills, total, err
}

func (r *SkillRepo) Update(skill *model.Skill) error {
	return r.db.Save(skill).Error
}

func (r *SkillRepo) Delete(id uint) error {
	return r.db.Delete(&model.Skill{}, id).Error
}
