// AIops/backend/internal/handler/user_handler.go
package handler

import (
	"strconv"

	"github.com/aiops/backend/internal/middleware"
	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/aiops/backend/internal/repository"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserHandler struct {
	userSvc   *service.UserService
	auditRepo *repository.AuditRepo
	validate  *validator.Validate
}

func NewUserHandler(userSvc *service.UserService, auditRepo *repository.AuditRepo) *UserHandler {
	return &UserHandler{userSvc: userSvc, auditRepo: auditRepo, validate: validator.New()}
}

func (h *UserHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	users, total, err := h.userSvc.List(page, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, gin.H{
		"items": users,
		"total": total,
		"page":  page,
	})
}

func (h *UserHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.InvalidParams(c, "invalid id")
		return
	}

	user, err := h.userSvc.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "user")
		return
	}

	response.Success(c, user)
}

type updateRoleRequest struct {
	Role string `json:"role" validate:"required,oneof=admin operator viewer"`
}

func (h *UserHandler) UpdateRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.InvalidParams(c, "invalid id")
		return
	}

	var req updateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	if err := h.userSvc.UpdateRole(uint(id), model.Role(req.Role)); err != nil {
		response.NotFound(c, "user")
		return
	}

	response.Success(c, gin.H{"message": "role updated"})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.InvalidParams(c, "invalid id")
		return
	}

	claims := middleware.GetClaims(c)
	if claims != nil && claims.UserID == uint(id) {
		response.Fail(c, 400, response.ErrCodeInvalidParams, "cannot delete yourself")
		return
	}

	if err := h.userSvc.Delete(uint(id)); err != nil {
		response.NotFound(c, "user")
		return
	}

	response.Success(c, gin.H{"message": "user deleted"})
}

func (h *UserHandler) AuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	logs, total, err := h.auditRepo.List(offset, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, gin.H{
		"items": logs,
		"total": total,
		"page":  page,
	})
}
