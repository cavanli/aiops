// AIops/backend/internal/model/skill.go
package model

type SkillCategory string

const (
	SkillCategoryEnv      SkillCategory = "env_setup"
	SkillCategoryDeploy   SkillCategory = "deployment"
	SkillCategoryTest     SkillCategory = "testing"
	SkillCategorySecurity SkillCategory = "security"
)

type Skill struct {
	BaseModel
	Name          string        `gorm:"size:128;not null" json:"name"`
	Category      SkillCategory `gorm:"size:32;not null" json:"category"`
	Description   string        `gorm:"type:text" json:"description"`
	ScriptContent string        `gorm:"type:text" json:"script_content"`
	ScriptType    string        `gorm:"size:16;default:'shell'" json:"script_type"`
	Author        string        `gorm:"size:64" json:"author"`
	CreatedBy     uint          `gorm:"not null;default:0" json:"created_by"`
}
