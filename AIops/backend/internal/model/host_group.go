// AIops/backend/internal/model/host_group.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type UintArray []uint

func (a *UintArray) Scan(value interface{}) error {
	if value == nil {
		*a = []uint{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for UintArray")
	}
	return json.Unmarshal(bytes, a)
}

func (a UintArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "[]", nil
	}
	return json.Marshal(a)
}

type HostGroup struct {
	BaseModel
	Name        string    `gorm:"size:128;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	HostIDs     UintArray `gorm:"type:jsonb;default:'[]'" json:"host_ids"`
}
