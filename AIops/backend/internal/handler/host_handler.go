// internal/handler/host_handler.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type HostHandler struct {
	hostSvc *service.HostService
}

func NewHostHandler(hostSvc *service.HostService) *HostHandler {
	return &HostHandler{hostSvc: hostSvc}
}

type CreateHostRequest struct {
	Name        string   `json:"name" binding:"required"`
	IP          string   `json:"ip" binding:"required,ip"`
	Port        int      `json:"port" binding:"required,min=1,max=65535"`
	SSHUser     string   `json:"ssh_user" binding:"required"`
	SSHKey      string   `json:"ssh_key" binding:"required"`
	Env         string   `json:"env" binding:"omitempty,oneof=production staging dev"`
	Tags        []string `json:"tags"`
	Description string   `json:"description"`
}

func (h *HostHandler) CreateHost(c *gin.Context) {
	var req CreateHostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, err.Error())
		return
	}

	host := &model.Host{
		Name:        req.Name,
		IP:          req.IP,
		Port:        req.Port,
		SSHUser:     req.SSHUser,
		SSHKey:      req.SSHKey,
		Env:         model.HostEnv(req.Env),
		Tags:        req.Tags,
		Description: req.Description,
	}

	if err := h.hostSvc.CreateHost(host); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, host)
}

func (h *HostHandler) GetHost(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid host ID")
		return
	}

	host, err := h.hostSvc.GetHost(uint(id))
	if err != nil {
		response.Fail(c, http.StatusNotFound, response.ErrCodeNotFound, "host not found")
		return
	}

	response.Success(c, host)
}

func (h *HostHandler) ListHosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize
	hosts, total, err := h.hostSvc.ListHosts(offset, pageSize)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{
		"items": hosts,
		"total": total,
		"page":  page,
		"page_size": pageSize,
	})
}

type UpdateHostRequest struct {
	Name        string   `json:"name"`
	IP          string   `json:"ip" binding:"omitempty,ip"`
	Port        int      `json:"port" binding:"omitempty,min=1,max=65535"`
	SSHUser     string   `json:"ssh_user"`
	SSHKey      string   `json:"ssh_key"`
	Env         string   `json:"env" binding:"omitempty,oneof=production staging dev"`
	Tags        []string `json:"tags"`
	Description string   `json:"description"`
}

func (h *HostHandler) UpdateHost(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid host ID")
		return
	}

	var req UpdateHostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, err.Error())
		return
	}

	host := &model.Host{
		BaseModel:   model.BaseModel{ID: uint(id)},
		Name:        req.Name,
		IP:          req.IP,
		Port:        req.Port,
		SSHUser:     req.SSHUser,
		SSHKey:      req.SSHKey,
		Env:         model.HostEnv(req.Env),
		Tags:        req.Tags,
		Description: req.Description,
	}

	if err := h.hostSvc.UpdateHost(host); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, host)
}

func (h *HostHandler) DeleteHost(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid host ID")
		return
	}

	if err := h.hostSvc.DeleteHost(uint(id)); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, nil)
}

func (h *HostHandler) TestConnection(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid host ID")
		return
	}

	if err := h.hostSvc.TestHostConnection(uint(id)); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "connection successful"})
}
