// AIops/backend/internal/model/host_env_var.go
package model

type HostEnvVar struct {
	BaseModel
	HostID      uint   `gorm:"not null;index" json:"host_id"`
	Key         string `gorm:"size:256;not null" json:"key"`
	Value       string `gorm:"type:text;not null" json:"value"`
	IsEncrypted bool   `gorm:"default:false" json:"is_encrypted"`
}
