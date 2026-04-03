// AIops/backend/internal/model/ai_model.go
package model

import "database/sql/driver"

type ModelProvider string

const (
	ModelProviderOpenAI    ModelProvider = "openai"
	ModelProviderAnthropic ModelProvider = "anthropic"
	ModelProviderDeepSeek  ModelProvider = "deepseek"
	ModelProviderQwen      ModelProvider = "qwen"
	ModelProviderCustom    ModelProvider = "custom"
)

func (p *ModelProvider) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*p = ModelProvider(v)
	}
	return nil
}

func (p ModelProvider) Value() (driver.Value, error) { return string(p), nil }

type ModelType string

const (
	ModelTypeChat      ModelType = "chat"
	ModelTypeEmbedding ModelType = "embedding"
)

func (t *ModelType) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*t = ModelType(v)
	}
	return nil
}

func (t ModelType) Value() (driver.Value, error) { return string(t), nil }

type ModelStatus string

const (
	ModelStatusActive   ModelStatus = "active"
	ModelStatusInactive ModelStatus = "inactive"
)

func (s *ModelStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = ModelStatus(v)
	}
	return nil
}

func (s ModelStatus) Value() (driver.Value, error) { return string(s), nil }

type AIModel struct {
	BaseModel
	Name        string        `gorm:"size:128;not null;uniqueIndex" json:"name"`
	Provider    ModelProvider `gorm:"size:64;not null" json:"provider"`
	ModelType   ModelType     `gorm:"size:32;not null" json:"model_type"`
	APIEndpoint string        `gorm:"size:512" json:"api_endpoint"`
	Description string        `gorm:"type:text" json:"description"`
	Status      ModelStatus   `gorm:"size:16;default:'active'" json:"status"`
}

func (AIModel) TableName() string { return "ai_models" }

type APIKeyStatus string

const (
	APIKeyStatusActive   APIKeyStatus = "active"
	APIKeyStatusInactive APIKeyStatus = "inactive"
)

func (s *APIKeyStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = APIKeyStatus(v)
	}
	return nil
}

func (s APIKeyStatus) Value() (driver.Value, error) { return string(s), nil }

type APIKey struct {
	BaseModel
	ModelID      uint         `gorm:"not null;index" json:"model_id"`
	KeyName      string       `gorm:"size:128;not null" json:"key_name"`
	EncryptedKey string       `gorm:"type:text;not null" json:"-"`
	Quota        int64        `gorm:"default:0" json:"quota"`
	UsedCount    int64        `gorm:"default:0" json:"used_count"`
	Status       APIKeyStatus `gorm:"size:16;default:'active'" json:"status"`
}

func (APIKey) TableName() string { return "api_keys" }
