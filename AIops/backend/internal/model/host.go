// AIops/backend/internal/model/host.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type HostStatus string

const (
	HostStatusOnline  HostStatus = "online"
	HostStatusOffline HostStatus = "offline"
	HostStatusUnknown HostStatus = "unknown"
)

func (s HostStatus) String() string {
	return string(s)
}

func (s *HostStatus) Scan(value interface{}) error {
	if value == nil {
		*s = HostStatusUnknown
		return nil
	}
	str, ok := value.(string)
	if !ok {
		return errors.New("invalid type for HostStatus")
	}
	*s = HostStatus(str)
	return nil
}

func (s HostStatus) Value() (driver.Value, error) {
	return string(s), nil
}

type HostEnv string

const (
	HostEnvProduction HostEnv = "production"
	HostEnvStaging    HostEnv = "staging"
	HostEnvDev        HostEnv = "dev"
)

func (e HostEnv) String() string {
	return string(e)
}

func (e *HostEnv) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	str, ok := value.(string)
	if !ok {
		return errors.New("invalid type for HostEnv")
	}
	*e = HostEnv(str)
	return nil
}

func (e HostEnv) Value() (driver.Value, error) {
	return string(e), nil
}

type StringArray []string

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = []string{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for StringArray")
	}
	return json.Unmarshal(bytes, a)
}

func (a StringArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "[]", nil
	}
	return json.Marshal(a)
}

type Host struct {
	BaseModel
	Name        string      `gorm:"size:128;not null" json:"name"`
	IP          string      `gorm:"size:64;not null" json:"ip"`
	Port        int         `gorm:"not null;default:22" json:"port"`
	SSHUser     string      `gorm:"size:64;not null" json:"ssh_user"`
	SSHKey      string      `gorm:"type:text" json:"-"`
	Status      HostStatus  `gorm:"size:16;default:'unknown'" json:"status"`
	Env         HostEnv     `gorm:"size:32" json:"env"`
	Tags        StringArray `gorm:"type:jsonb;default:'[]'" json:"tags"`
	Description string      `gorm:"type:text" json:"description"`
}
