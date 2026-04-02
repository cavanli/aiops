// AIops/backend/internal/service/auth_service_test.go
package service

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/jwt"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"github.com/aiops/backend/internal/repository"
)

func setupAuthService(t *testing.T) *AuthService {
	t.Helper()
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&model.User{})
	userRepo := repository.NewUserRepo(db)
	jwtSvc := jwt.New("test-secret-min-32-chars-padding!!", 15*60*1e9, 7*24*3600*1e9)
	return NewAuthService(userRepo, jwtSvc)
}

func TestAuthService_RegisterAndLogin(t *testing.T) {
	svc := setupAuthService(t)

	err := svc.Register("bob", "bob@example.com", "password123")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	accessToken, _, err := svc.Login("bob@example.com", "password123")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}
	if accessToken == "" {
		t.Error("expected non-empty access token")
	}
}

func TestAuthService_Login_WrongPassword(t *testing.T) {
	svc := setupAuthService(t)
	svc.Register("eve", "eve@example.com", "correct")

	_, _, err := svc.Login("eve@example.com", "wrong")
	if err == nil {
		t.Error("expected error for wrong password")
	}
}

func TestAuthService_Register_DuplicateEmail(t *testing.T) {
	svc := setupAuthService(t)
	svc.Register("user1", "dup@example.com", "pass")
	err := svc.Register("user2", "dup@example.com", "pass")
	if err == nil {
		t.Error("expected error for duplicate email")
	}
}
