// AIops/backend/internal/handler/auth_handler.go
package handler

import (
	"net/http"

	"github.com/aiops/backend/internal/pkg/response"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	authSvc  *service.AuthService
	validate *validator.Validate
}

func NewAuthHandler(authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, validate: validator.New()}
}

type registerRequest struct {
	Username string `json:"username" validate:"required,min=3,max=64"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type loginRequest struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	if err := h.authSvc.Register(req.Username, req.Email, req.Password); err != nil {
		response.Conflict(c, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"code": 0, "message": "registered successfully"})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	accessToken, refreshToken, err := h.authSvc.Login(req.Email, req.Password)
	if err != nil {
		response.Fail(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, err.Error())
		return
	}

	response.Success(c, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	accessToken, err := h.authSvc.RefreshToken(req.RefreshToken)
	if err != nil {
		response.Fail(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, err.Error())
		return
	}

	response.Success(c, gin.H{"access_token": accessToken, "token_type": "Bearer"})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Stateless JWT: client discards token. Future: blacklist in Redis.
	response.Success(c, gin.H{"message": "logged out"})
}
