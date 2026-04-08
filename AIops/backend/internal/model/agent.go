// AIops/backend/internal/model/agent.go
package model

type AgentStatus string

const (
	AgentStatusActive   AgentStatus = "active"
	AgentStatusInactive AgentStatus = "inactive"
)

type Agent struct {
	BaseModel
	Name      string      `gorm:"size:128;not null" json:"name"`
	Role      string      `gorm:"size:128" json:"role"`
	Status    AgentStatus `gorm:"size:16;default:'inactive'" json:"status"`
	ModelName string      `gorm:"size:128" json:"model_name"`
	Focus     string      `gorm:"type:text" json:"focus"`
	TaskCount int         `gorm:"default:0" json:"task_count"`
	CreatedBy uint        `gorm:"not null;default:0" json:"created_by"`
}
