// internal/handler/agent_handler.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type AgentHandler struct {
	agentSvc *service.AgentService
}

func NewAgentHandler(agentSvc *service.AgentService) *AgentHandler {
	return &AgentHandler{agentSvc: agentSvc}
}

type CreateAgentRequest struct {
	Name      string `json:"name" binding:"required"`
	Role      string `json:"role"`
	Status    string `json:"status" binding:"omitempty,oneof=active inactive"`
	ModelName string `json:"model_name"`
	Focus     string `json:"focus"`
}

func (h *AgentHandler) CreateAgent(c *gin.Context) {
	var req CreateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, err.Error())
		return
	}

	status := req.Status
	if status == "" {
		status = "inactive"
	}

	agent := &model.Agent{
		Name:      req.Name,
		Role:      req.Role,
		Status:    model.AgentStatus(status),
		ModelName: req.ModelName,
		Focus:     req.Focus,
	}

	if err := h.agentSvc.CreateAgent(agent); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, agent)
}

func (h *AgentHandler) GetAgent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid agent ID")
		return
	}

	agent, err := h.agentSvc.GetAgent(uint(id))
	if err != nil {
		response.Fail(c, http.StatusNotFound, response.ErrCodeNotFound, "agent not found")
		return
	}

	response.Success(c, agent)
}

func (h *AgentHandler) ListAgents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	agents, total, err := h.agentSvc.ListAgents(offset, pageSize)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{
		"items":     agents,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

type UpdateAgentRequest struct {
	Name      string `json:"name"`
	Role      string `json:"role"`
	Status    string `json:"status" binding:"omitempty,oneof=active inactive"`
	ModelName string `json:"model_name"`
	Focus     string `json:"focus"`
}

func (h *AgentHandler) UpdateAgent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid agent ID")
		return
	}

	var req UpdateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, err.Error())
		return
	}

	agent := &model.Agent{
		BaseModel: model.BaseModel{ID: uint(id)},
		Name:      req.Name,
		Role:      req.Role,
		Status:    model.AgentStatus(req.Status),
		ModelName: req.ModelName,
		Focus:     req.Focus,
	}

	if err := h.agentSvc.UpdateAgent(agent); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, agent)
}

func (h *AgentHandler) DeleteAgent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid agent ID")
		return
	}

	if err := h.agentSvc.DeleteAgent(uint(id)); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, nil)
}
