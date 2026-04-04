// AIops/backend/internal/model/deployment.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type ScriptType string

const (
	ScriptTypeShell         ScriptType = "shell"
	ScriptTypePython        ScriptType = "python"
	ScriptTypeHelm          ScriptType = "helm"
	ScriptTypeDockerCompose ScriptType = "docker-compose"
)

func (s *ScriptType) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = ScriptType(v)
	}
	return nil
}
func (s ScriptType) Value() (driver.Value, error) { return string(s), nil }

type JSONBMap map[string]interface{}

func (m *JSONBMap) Scan(value interface{}) error {
	if value == nil {
		*m = JSONBMap{}
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for JSONBMap")
	}
	return json.Unmarshal(b, m)
}
func (m JSONBMap) Value() (driver.Value, error) {
	if len(m) == 0 {
		return "{}", nil
	}
	return json.Marshal(m)
}

type DeploymentTemplate struct {
	BaseModel
	Name          string     `gorm:"size:128;not null" json:"name"`
	Description   string     `gorm:"type:text" json:"description"`
	ScriptType    ScriptType `gorm:"size:32;not null" json:"script_type"`
	ScriptContent string     `gorm:"type:text;not null" json:"script_content"`
	Params        JSONBMap   `gorm:"type:jsonb;default:'{}'" json:"params"`
	HealthCheck   JSONBMap   `gorm:"type:jsonb" json:"health_check"`
	CreatedBy     uint       `gorm:"not null;index" json:"created_by"`
}

func (DeploymentTemplate) TableName() string { return "deployment_templates" }

type DeployStrategy string

const (
	DeployStrategyFailFast          DeployStrategy = "fail_fast"
	DeployStrategyContinueOnFailure DeployStrategy = "continue_on_failure"
)

func (s *DeployStrategy) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = DeployStrategy(v)
	}
	return nil
}
func (s DeployStrategy) Value() (driver.Value, error) { return string(s), nil }

type DeployTaskStatus string

const (
	DeployTaskStatusPending   DeployTaskStatus = "pending"
	DeployTaskStatusRunning   DeployTaskStatus = "running"
	DeployTaskStatusSuccess   DeployTaskStatus = "success"
	DeployTaskStatusFailed    DeployTaskStatus = "failed"
	DeployTaskStatusCancelled DeployTaskStatus = "cancelled"
)

func (s *DeployTaskStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = DeployTaskStatus(v)
	}
	return nil
}
func (s DeployTaskStatus) Value() (driver.Value, error) { return string(s), nil }

type DeploymentTask struct {
	BaseModel
	TemplateID uint             `gorm:"index" json:"template_id"`
	HostIDs    UintArray        `gorm:"type:jsonb;not null;default:'[]'" json:"host_ids"`
	Params     JSONBMap         `gorm:"type:jsonb;default:'{}'" json:"params"`
	Strategy   DeployStrategy   `gorm:"size:32;default:'fail_fast'" json:"strategy"`
	Status     DeployTaskStatus `gorm:"size:16;not null;default:'pending'" json:"status"`
	Logs       JSONBArray       `gorm:"type:jsonb;default:'[]'" json:"logs"`
	StartTime  *TimePtr         `json:"start_time"`
	EndTime    *TimePtr         `json:"end_time"`
	CreatedBy  uint             `gorm:"not null;index" json:"created_by"`
}

func (DeploymentTask) TableName() string { return "deployment_tasks" }
