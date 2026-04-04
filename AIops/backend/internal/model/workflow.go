// AIops/backend/internal/model/workflow.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type WorkflowStatus string

const (
	WorkflowStatusDraft    WorkflowStatus = "draft"
	WorkflowStatusActive   WorkflowStatus = "active"
	WorkflowStatusInactive WorkflowStatus = "inactive"
)

func (s *WorkflowStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = WorkflowStatus(v)
	}
	return nil
}

func (s WorkflowStatus) Value() (driver.Value, error) { return string(s), nil }

type JSONBArray []interface{}

func (a *JSONBArray) Scan(value interface{}) error {
	if value == nil {
		*a = []interface{}{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for JSONBArray")
	}
	return json.Unmarshal(bytes, a)
}

func (a JSONBArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "[]", nil
	}
	return json.Marshal(a)
}

type Workflow struct {
	BaseModel
	Name        string         `gorm:"size:128;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Nodes       JSONBArray     `gorm:"type:jsonb;not null;default:'[]'" json:"nodes"`
	Edges       JSONBArray     `gorm:"type:jsonb;not null;default:'[]'" json:"edges"`
	Status      WorkflowStatus `gorm:"size:16;default:'draft'" json:"status"`
	CreatedBy   uint           `gorm:"not null;index" json:"created_by"`
}

func (Workflow) TableName() string { return "workflows" }

type ExecutionStatus string

const (
	ExecutionStatusPending   ExecutionStatus = "pending"
	ExecutionStatusRunning   ExecutionStatus = "running"
	ExecutionStatusSuccess   ExecutionStatus = "success"
	ExecutionStatusFailed    ExecutionStatus = "failed"
	ExecutionStatusCancelled ExecutionStatus = "cancelled"
)

func (s *ExecutionStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = ExecutionStatus(v)
	}
	return nil
}

func (s ExecutionStatus) Value() (driver.Value, error) { return string(s), nil }

type WorkflowExecution struct {
	BaseModel
	WorkflowID uint            `gorm:"not null;index" json:"workflow_id"`
	Status     ExecutionStatus `gorm:"size:16;not null;default:'pending'" json:"status"`
	StartTime  *TimePtr        `json:"start_time"`
	EndTime    *TimePtr        `json:"end_time"`
	Logs       JSONBArray      `gorm:"type:jsonb;default:'[]'" json:"logs"`
	CreatedBy  uint            `gorm:"not null;index" json:"created_by"`
}

func (WorkflowExecution) TableName() string { return "workflow_executions" }
