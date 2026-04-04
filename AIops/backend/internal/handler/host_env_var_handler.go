// internal/handler/host_env_var_handler.go
package handler

import (
	"strconv"

	"github.com/aiops/backend/internal/pkg/response"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type HostEnvVarHandler struct {
	svc *service.HostEnvVarService
}

func NewHostEnvVarHandler(svc *service.HostEnvVarService) *HostEnvVarHandler {
	return &HostEnvVarHandler{svc: svc}
}

type CreateEnvVarRequest struct {
	Key     string `json:"key" binding:"required"`
	Value   string `json:"value" binding:"required"`
	Encrypt bool   `json:"encrypt"`
}

func (h *HostEnvVarHandler) Create(c *gin.Context) {
	hostID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid host ID")
		return
	}
	var req CreateEnvVarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	ev, err := h.svc.Create(uint(hostID), req.Key, req.Value, req.Encrypt)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, ev)
}

func (h *HostEnvVarHandler) List(c *gin.Context) {
	hostID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid host ID")
		return
	}
	evs, err := h.svc.ListByHost(uint(hostID))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, evs)
}

func (h *HostEnvVarHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("var_id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid env var ID")
		return
	}
	if err := h.svc.Delete(uint(id)); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, nil)
}
