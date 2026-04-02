// AIops/backend/internal/repository/user_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory db: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	return db
}

func TestUserRepo_CreateAndFindByEmail(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepo(db)

	user := &model.User{
		Username:     "alice",
		Email:        "alice@example.com",
		PasswordHash: "hashed_password",
		Role:         model.RoleViewer,
	}
	if err := repo.Create(user); err != nil {
		t.Fatalf("create failed: %v", err)
	}
	if user.ID == 0 {
		t.Error("expected non-zero ID after create")
	}

	found, err := repo.FindByEmail("alice@example.com")
	if err != nil {
		t.Fatalf("find by email failed: %v", err)
	}
	if found.Username != "alice" {
		t.Errorf("expected username alice, got %s", found.Username)
	}
}

func TestUserRepo_FindByEmail_NotFound(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepo(db)

	_, err := repo.FindByEmail("nobody@example.com")
	if err == nil {
		t.Error("expected error for missing user")
	}
}
