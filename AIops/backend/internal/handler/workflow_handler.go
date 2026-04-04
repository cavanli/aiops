// AIops/backend/internal/handler/workflow_handler.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

type WorkflowServiceInterface interface {
	CreateWorkflow(wf *model.Workflow) error
	GetWorkflow(id uint) (*model.Workflow, error)
	ListWorkflows(offset, limit int) ([]*model.Workflow, int64, error)
	UpdateWorkflow(wf *model.Workflow) error
	DeleteWorkflow(id uint) error
	ExecuteWorkflow(workflowID, userID uint) (*model.WorkflowExecution, error)
	GetExecution(id uint) (*model.WorkflowExecution, error)
	ListExecutions(workflowID uint, offset, limit int) ([]*model.WorkflowExecution, int64, error)
}

type WorkflowHandler struct {
	svc WorkflowServiceInterface
}

func NewWorkflowHandler(svc WorkflowServiceInterface) *WorkflowHandler {
	return &WorkflowHandler{svc: svc}
}

type CreateWorkflowRequest struct {
	Name        string                   `json:"name" binding:"required"`
	Description string                   `json:"description"`
	Nodes       []interface{}            `json:"nodes"`
	Edges       []interface{}            `json:"edges"`
}

func (h *WorkflowHandler) CreateWorkflow(c *gin.Context) {
	var req CreateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	wf := &model.Workflow{
		Name:        req.Name,
		Description: req.Description,
		Nodes:       req.Nodes,
		Edges:       req.Edges,
		CreatedBy:   userID,
	}

	if err := h.svc.CreateWorkflow(wf); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, wf)
}

func (h *WorkflowHandler) GetWorkflow(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid workflow ID")
		return
	}

	wf, err := h.svc.GetWorkflow(uint(id))
	if err != nil {
		response.NotFound(c, "workflow")
		return
	}
	response.Success(c, wf)
}

func (h *WorkflowHandler) ListWorkflows(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	workflows, total, err := h.svc.ListWorkflows(offset, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, gin.H{"items": workflows, "total": total, "page": page, "page_size": pageSize})
}

type UpdateWorkflowRequest struct {
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Nodes       []interface{} `json:"nodes"`
	Edges       []interface{} `json:"edges"`
	Status      string        `json:"status" binding:"omitempty,oneof=draft active inactive"`
}

func (h *WorkflowHandler) UpdateWorkflow(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid workflow ID")
		return
	}

	var req UpdateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	wf := &model.Workflow{
		BaseModel:   model.BaseModel{ID: uint(id)},
		Name:        req.Name,
		Description: req.Description,
		Nodes:       req.Nodes,
		Edges:       req.Edges,
		Status:      model.WorkflowStatus(req.Status),
	}

	if err := h.svc.UpdateWorkflow(wf); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, wf)
}

func (h *WorkflowHandler) DeleteWorkflow(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid workflow ID")
		return
	}
	if err := h.svc.DeleteWorkflow(uint(id)); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, nil)
}

func (h *WorkflowHandler) ExecuteWorkflow(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid workflow ID")
		return
	}

	userID := c.GetUint("user_id")
	exec, err := h.svc.ExecuteWorkflow(uint(id), userID)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, err.Error())
		return
	}
	response.Success(c, exec)
}

func (h *WorkflowHandler) GetExecution(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid execution ID")
		return
	}

	exec, err := h.svc.GetExecution(uint(id))
	if err != nil {
		response.NotFound(c, "execution")
		return
	}
	response.Success(c, exec)
}

func (h *WorkflowHandler) ListExecutions(c *gin.Context) {
	workflowID, err := strconv.ParseUint(c.Query("workflow_id"), 10, 32)
	if err != nil || workflowID == 0 {
		response.InvalidParams(c, "workflow_id is required")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	execs, total, err := h.svc.ListExecutions(uint(workflowID), offset, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, gin.H{"items": execs, "total": total, "page": page, "page_size": pageSize})
}
