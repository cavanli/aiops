// AIops/backend/internal/service/user_service.go
package service

import (
	"errors"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
)

type UserService struct {
	userRepo *repository.UserRepo
}

func NewUserService(userRepo *repository.UserRepo) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) List(page, pageSize int) ([]model.User, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	return s.userRepo.List(offset, pageSize)
}

func (s *UserService) GetByID(id uint) (*model.User, error) {
	return s.userRepo.FindByID(id)
}

func (s *UserService) UpdateRole(id uint, role model.Role) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}
	if role != model.RoleAdmin && role != model.RoleOperator && role != model.RoleViewer {
		return errors.New("invalid role")
	}
	user.Role = role
	return s.userRepo.Update(user)
}

func (s *UserService) Delete(id uint) error {
	if _, err := s.userRepo.FindByID(id); err != nil {
		return errors.New("user not found")
	}
	return s.userRepo.Delete(id)
}
