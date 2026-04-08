// AIops/backend/internal/service/auth_service.go
package service

import (
	"errors"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/jwt"
	"github.com/aiops/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repository.UserRepo
	jwtSvc   *jwt.Service
}

func NewAuthService(userRepo *repository.UserRepo, jwtSvc *jwt.Service) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSvc: jwtSvc}
}

func (s *AuthService) Register(username, email, password string) error {
	if _, err := s.userRepo.FindByEmail(email); err == nil {
		return errors.New("email already registered")
	}
	if _, err := s.userRepo.FindByUsername(username); err == nil {
		return errors.New("username already taken")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}

	// First registered user becomes admin; subsequent users are viewers.
	role := model.RoleViewer
	if _, total, _ := s.userRepo.List(0, 1); total == 0 {
		role = model.RoleAdmin
	}

	return s.userRepo.Create(&model.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hash),
		Role:         role,
		Status:       model.UserStatusActive,
	})
}

// Login returns (accessToken, refreshToken, user, error).
func (s *AuthService) Login(email, password string) (string, string, *model.User, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}

	if user.Status != model.UserStatusActive {
		return "", "", nil, errors.New("account is inactive")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}

	accessToken, err := s.jwtSvc.GenerateAccessToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		return "", "", nil, err
	}

	refreshToken, err := s.jwtSvc.GenerateRefreshToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, user, nil
}

func (s *AuthService) RefreshToken(refreshToken string) (string, error) {
	claims, err := s.jwtSvc.ParseToken(refreshToken)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}
	if claims.Subject != "refresh" {
		return "", errors.New("not a refresh token")
	}

	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		return "", errors.New("user not found")
	}

	return s.jwtSvc.GenerateAccessToken(user.ID, user.Username, string(user.Role))
}
