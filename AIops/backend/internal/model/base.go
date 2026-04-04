// AIops/backend/internal/model/base.go
package model

import (
	"database/sql/driver"
	"time"
)

type BaseModel struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type TimePtr struct {
	time.Time
}

func (t *TimePtr) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	if v, ok := value.(time.Time); ok {
		t.Time = v
	}
	return nil
}

func (t TimePtr) Value() (driver.Value, error) {
	if t.Time.IsZero() {
		return nil, nil
	}
	return t.Time, nil
}
