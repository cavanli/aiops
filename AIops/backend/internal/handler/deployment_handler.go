// AIops/backend/internal/handler/deployment_handler.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

type DeploymentServiceInterface interface {
	CreateTemplate(t *model.DeploymentTemplate) error
	GetTemplate(id uint) (*model.DeploymentTemplate, error)
	ListTemplates(offset, limit int) ([]*model.DeploymentTemplate, int64, error)
	UpdateTemplate(t *model.DeploymentTemplate) error
	DeleteTemplate(id uint) error
	CreateTask(task *model.DeploymentTask) error
	GetTask(id uint) (*model.DeploymentTask, error)
	ListTasks(offset, limit int) ([]*model.DeploymentTask, int64, error)
	CancelTask(id uint) error
}

type DeploymentHandler struct {
	svc DeploymentServiceInterface
}

func NewDeploymentHandler(svc DeploymentServiceInterface) *DeploymentHandler {
	return &DeploymentHandler{svc: svc}
}

type CreateTemplateRequest struct {
	Name          string                 `json:"name" binding:"required"`
	Description   string                 `json:"description"`
	ScriptType    string                 `json:"script_type" binding:"required,oneof=shell python helm docker-compose"`
	ScriptContent string                 `json:"script_content" binding:"required"`
	Params        map[string]interface{} `json:"params"`
	HealthCheck   map[string]interface{} `json:"health_check"`
}

func (h *DeploymentHandler) CreateTemplate(c *gin.Context) {
	var req CreateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	tmpl := &model.DeploymentTemplate{
		Name:          req.Name,
		Description:   req.Description,
		ScriptType:    model.ScriptType(req.ScriptType),
		ScriptContent: req.ScriptContent,
		Params:        req.Params,
		HealthCheck:   req.HealthCheck,
		CreatedBy:     c.GetUint("user_id"),
	}

	if err := h.svc.CreateTemplate(tmpl); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, tmpl)
}

func (h *DeploymentHandler) GetTemplate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid template ID")
		return
	}
	tmpl, err := h.svc.GetTemplate(uint(id))
	if err != nil {
		response.NotFound(c, "template")
		return
	}
	response.Success(c, tmpl)
}

func (h *DeploymentHandler) ListTemplates(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	templates, total, err := h.svc.ListTemplates((page-1)*pageSize, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, gin.H{"items": templates, "total": total, "page": page, "page_size": pageSize})
}

type UpdateTemplateRequest struct {
	Name          string                 `json:"name"`
	Description   string                 `json:"description"`
	ScriptType    string                 `json:"script_type" binding:"omitempty,oneof=shell python helm docker-compose"`
	ScriptContent string                 `json:"script_content"`
	Params        map[string]interface{} `json:"params"`
	HealthCheck   map[string]interface{} `json:"health_check"`
}

func (h *DeploymentHandler) UpdateTemplate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid template ID")
		return
	}
	var req UpdateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	tmpl := &model.DeploymentTemplate{
		BaseModel:     model.BaseModel{ID: uint(id)},
		Name:          req.Name,
		Description:   req.Description,
		ScriptType:    model.ScriptType(req.ScriptType),
		ScriptContent: req.ScriptContent,
		Params:        req.Params,
		HealthCheck:   req.HealthCheck,
	}
	if err := h.svc.UpdateTemplate(tmpl); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, tmpl)
}

func (h *DeploymentHandler) DeleteTemplate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid template ID")
		return
	}
	if err := h.svc.DeleteTemplate(uint(id)); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, nil)
}

type CreateTaskRequest struct {
	TemplateID uint                   `json:"template_id" binding:"required"`
	HostIDs    []uint                 `json:"host_ids" binding:"required,min=1"`
	Params     map[string]interface{} `json:"params"`
	Strategy   string                 `json:"strategy" binding:"omitempty,oneof=fail_fast continue_on_failure"`
}

func (h *DeploymentHandler) CreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	strategy := model.DeployStrategyFailFast
	if req.Strategy == string(model.DeployStrategyContinueOnFailure) {
		strategy = model.DeployStrategyContinueOnFailure
	}

	task := &model.DeploymentTask{
		TemplateID: req.TemplateID,
		HostIDs:    req.HostIDs,
		Params:     req.Params,
		Strategy:   strategy,
		CreatedBy:  c.GetUint("user_id"),
	}

	if err := h.svc.CreateTask(task); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, task)
}

func (h *DeploymentHandler) GetTask(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid task ID")
		return
	}
	task, err := h.svc.GetTask(uint(id))
	if err != nil {
		response.NotFound(c, "deployment task")
		return
	}
	response.Success(c, task)
}

func (h *DeploymentHandler) ListTasks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	tasks, total, err := h.svc.ListTasks((page-1)*pageSize, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, gin.H{"items": tasks, "total": total, "page": page, "page_size": pageSize})
}

func (h *DeploymentHandler) CancelTask(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid task ID")
		return
	}
	if err := h.svc.CancelTask(uint(id)); err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, err.Error())
		return
	}
	response.Success(c, nil)
}
