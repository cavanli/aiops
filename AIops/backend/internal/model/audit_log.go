// AIops/backend/internal/model/audit_log.go
package model

import "time"

type AuditLog struct {
	ID           uint      `gorm:"primarykey"      json:"id"`
	UserID       uint      `gorm:"index;not null"  json:"user_id"`
	Action       string    `gorm:"not null;size:32" json:"action"`  // create/update/delete/execute
	ResourceType string    `gorm:"not null;size:64" json:"resource_type"`
	ResourceID   string    `gorm:"size:64"          json:"resource_id"`
	Details      string    `gorm:"type:jsonb"       json:"details"`
	IP           string    `gorm:"size:64"          json:"ip"`
	CreatedAt    time.Time `json:"created_at"`
}

func (AuditLog) TableName() string { return "audit_logs" }
