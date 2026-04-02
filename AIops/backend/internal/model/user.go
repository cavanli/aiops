// AIops/backend/internal/model/user.go
package model

type Role string

const (
	RoleAdmin    Role = "admin"
	RoleOperator Role = "operator"
	RoleViewer   Role = "viewer"
)

type UserStatus string

const (
	UserStatusActive   UserStatus = "active"
	UserStatusInactive UserStatus = "inactive"
)

type User struct {
	BaseModel
	Username     string     `gorm:"uniqueIndex;not null;size:64"  json:"username"`
	Email        string     `gorm:"uniqueIndex;not null;size:128" json:"email"`
	PasswordHash string     `gorm:"not null;size:256"             json:"-"`
	Role         Role       `gorm:"not null;default:viewer"       json:"role"`
	Status       UserStatus `gorm:"not null;default:active"       json:"status"`
}

func (User) TableName() string { return "users" }
