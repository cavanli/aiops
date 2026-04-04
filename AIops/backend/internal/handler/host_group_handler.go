// internal/handler/host_group_handler.go
package handler

import (
	"strconv"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type HostGroupHandler struct {
	svc *service.HostGroupService
}

func NewHostGroupHandler(svc *service.HostGroupService) *HostGroupHandler {
	return &HostGroupHandler{svc: svc}
}

type CreateHostGroupRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	HostIDs     []uint `json:"host_ids"`
}

func (h *HostGroupHandler) Create(c *gin.Context) {
	var req CreateHostGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	group := &model.HostGroup{
		Name:        req.Name,
		Description: req.Description,
		HostIDs:     req.HostIDs,
	}
	if err := h.svc.CreateGroup(group); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, group)
}

func (h *HostGroupHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid group ID")
		return
	}
	group, err := h.svc.GetGroup(uint(id))
	if err != nil {
		response.NotFound(c, "host group")
		return
	}
	response.Success(c, group)
}

func (h *HostGroupHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	groups, total, err := h.svc.ListGroups((page-1)*pageSize, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, gin.H{"items": groups, "total": total, "page": page, "page_size": pageSize})
}

type UpdateHostGroupRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	HostIDs     []uint `json:"host_ids"`
}

func (h *HostGroupHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid group ID")
		return
	}
	var req UpdateHostGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	group := &model.HostGroup{
		BaseModel:   model.BaseModel{ID: uint(id)},
		Name:        req.Name,
		Description: req.Description,
		HostIDs:     req.HostIDs,
	}
	if err := h.svc.UpdateGroup(group); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, group)
}

func (h *HostGroupHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid group ID")
		return
	}
	if err := h.svc.DeleteGroup(uint(id)); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, nil)
}
