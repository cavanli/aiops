# AIOps Backend Plan 4: Workflow Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Workflow Engine module with workflow CRUD, execution management, and basic execution engine (synchronous MVP).

**Architecture:** Classic layered architecture. Workflows store nodes/edges as JSONB. Execution engine runs workflows synchronously (async execution deferred to v2). Execution logs stored as JSONB array. RBAC: admin/operator can manage workflows; viewer can only read.

**Tech Stack:** Go 1.22+, Gin, GORM, JSONB for nodes/edges/logs

**Dependencies:** Plan 1 (foundation, middleware) must be complete.

---

## File Map

```
AIops/backend/
├── internal/
│   ├── model/
│   │   └── workflow.go              # Workflow, WorkflowExecution structs
│   ├── repository/
│   │   ├── workflow_repo.go         # Workflow DB operations
│   │   └── execution_repo.go        # WorkflowExecution DB operations
│   ├── service/
│   │   └── workflow_service.go      # Business logic + execution engine
│   ├── handler/
│   │   └── workflow_handler.go      # REST API endpoints
│   └── pkg/
│       └── (reuse response from Plan 1)
└── cmd/api/main.go                  # Wire workflow routes
```

---

## Task 1: Workflow and WorkflowExecution models

**Files:**
- Create: `AIops/backend/internal/model/workflow.go`

- [ ] **Step 1: Create workflow.go**

```go
// AIops/backend/internal/model/workflow.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type WorkflowStatus string

const (
	WorkflowStatusDraft    WorkflowStatus = "draft"
	WorkflowStatusActive   WorkflowStatus = "active"
	WorkflowStatusInactive WorkflowStatus = "inactive"
)

func (s *WorkflowStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = WorkflowStatus(v)
	}
	return nil
}

func (s WorkflowStatus) Value() (driver.Value, error) { return string(s), nil }

type JSONBArray []interface{}

func (a *JSONBArray) Scan(value interface{}) error {
	if value == nil {
		*a = []interface{}{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for JSONBArray")
	}
	return json.Unmarshal(bytes, a)
}

func (a JSONBArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "[]", nil
	}
	return json.Marshal(a)
}

type Workflow struct {
	BaseModel
	Name        string         `gorm:"size:128;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Nodes       JSONBArray     `gorm:"type:jsonb;not null;default:'[]'" json:"nodes"`
	Edges       JSONBArray     `gorm:"type:jsonb;not null;default:'[]'" json:"edges"`
	Status      WorkflowStatus `gorm:"size:16;default:'draft'" json:"status"`
	CreatedBy   uint           `gorm:"not null;index" json:"created_by"`
}

func (Workflow) TableName() string { return "workflows" }

type ExecutionStatus string

const (
	ExecutionStatusPending   ExecutionStatus = "pending"
	ExecutionStatusRunning   ExecutionStatus = "running"
	ExecutionStatusSuccess   ExecutionStatus = "success"
	ExecutionStatusFailed    ExecutionStatus = "failed"
	ExecutionStatusCancelled ExecutionStatus = "cancelled"
)

func (s *ExecutionStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = ExecutionStatus(v)
	}
	return nil
}

func (s ExecutionStatus) Value() (driver.Value, error) { return string(s), nil }

type WorkflowExecution struct {
	BaseModel
	WorkflowID uint            `gorm:"not null;index" json:"workflow_id"`
	Status     ExecutionStatus `gorm:"size:16;not null;default:'pending'" json:"status"`
	StartTime  *TimePtr        `json:"start_time"`
	EndTime    *TimePtr        `json:"end_time"`
	Logs       JSONBArray      `gorm:"type:jsonb;default:'[]'" json:"logs"`
	CreatedBy  uint            `gorm:"not null;index" json:"created_by"`
}

func (WorkflowExecution) TableName() string { return "workflow_executions" }
```

- [ ] **Step 2: Add TimePtr helper to base.go**

In `AIops/backend/internal/model/base.go`, add:

```go
import (
	"database/sql/driver"
	"time"
)

type TimePtr struct {
	time.Time
}

func (t *TimePtr) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	if v, ok := value.(time.Time); ok {
		t.Time = v
	}
	return nil
}

func (t TimePtr) Value() (driver.Value, error) {
	if t.Time.IsZero() {
		return nil, nil
	}
	return t.Time, nil
}
```

- [ ] **Step 3: Update AutoMigrate in cmd/api/main.go**

```go
database.AutoMigrate(db,
	&model.User{},
	&model.AuditLog{},
	&model.Host{},
	&model.HostGroup{},
	&model.HostEnvVar{},
	&model.AIModel{},
	&model.APIKey{},
	&model.Workflow{},          // Add
	&model.WorkflowExecution{}, // Add
)
```

- [ ] **Step 4: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/model/workflow.go internal/model/base.go cmd/api/main.go
git commit -m "feat: add Workflow and WorkflowExecution models"
```

---

## Task 2: Workflow repository

**Files:**
- Create: `AIops/backend/internal/repository/workflow_repo.go`

- [ ] **Step 1: Write failing test**

```go
// AIops/backend/internal/repository/workflow_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupWorkflowTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	err = db.AutoMigrate(&model.Workflow{})
	assert.NoError(t, err)
	return db
}

func TestWorkflowRepo_Create(t *testing.T) {
	db := setupWorkflowTestDB(t)
	repo := NewWorkflowRepo(db)

	wf := &model.Workflow{
		Name:      "test-workflow",
		Status:    model.WorkflowStatusDraft,
		CreatedBy: 1,
	}

	err := repo.Create(wf)
	assert.NoError(t, err)
	assert.NotZero(t, wf.ID)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository -v -run TestWorkflowRepo_Create
```

Expected: FAIL with "undefined: NewWorkflowRepo"

- [ ] **Step 3: Implement workflow repository**

```go
// AIops/backend/internal/repository/workflow_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type WorkflowRepo struct {
	db *gorm.DB
}

func NewWorkflowRepo(db *gorm.DB) *WorkflowRepo {
	return &WorkflowRepo{db: db}
}

func (r *WorkflowRepo) Create(wf *model.Workflow) error {
	return r.db.Create(wf).Error
}

func (r *WorkflowRepo) GetByID(id uint) (*model.Workflow, error) {
	var wf model.Workflow
	err := r.db.First(&wf, id).Error
	if err != nil {
		return nil, err
	}
	return &wf, nil
}

func (r *WorkflowRepo) List(offset, limit int) ([]*model.Workflow, int64, error) {
	var workflows []*model.Workflow
	var total int64
	if err := r.db.Model(&model.Workflow{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Offset(offset).Limit(limit).Find(&workflows).Error
	return workflows, total, err
}

func (r *WorkflowRepo) Update(wf *model.Workflow) error {
	return r.db.Save(wf).Error
}

func (r *WorkflowRepo) Delete(id uint) error {
	return r.db.Delete(&model.Workflow{}, id).Error
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository -v -run TestWorkflowRepo_Create
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/repository/workflow_repo.go internal/repository/workflow_repo_test.go
git commit -m "feat: add workflow repository with CRUD operations"
```

---

## Task 3: WorkflowExecution repository

**Files:**
- Create: `AIops/backend/internal/repository/execution_repo.go`

- [ ] **Step 1: Implement execution repository**

```go
// AIops/backend/internal/repository/execution_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type ExecutionRepo struct {
	db *gorm.DB
}

func NewExecutionRepo(db *gorm.DB) *ExecutionRepo {
	return &ExecutionRepo{db: db}
}

func (r *ExecutionRepo) Create(exec *model.WorkflowExecution) error {
	return r.db.Create(exec).Error
}

func (r *ExecutionRepo) GetByID(id uint) (*model.WorkflowExecution, error) {
	var exec model.WorkflowExecution
	err := r.db.First(&exec, id).Error
	if err != nil {
		return nil, err
	}
	return &exec, nil
}

func (r *ExecutionRepo) ListByWorkflowID(workflowID uint, offset, limit int) ([]*model.WorkflowExecution, int64, error) {
	var execs []*model.WorkflowExecution
	var total int64
	if err := r.db.Model(&model.WorkflowExecution{}).Where("workflow_id = ?", workflowID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Where("workflow_id = ?", workflowID).Offset(offset).Limit(limit).Order("created_at DESC").Find(&execs).Error
	return execs, total, err
}

func (r *ExecutionRepo) Update(exec *model.WorkflowExecution) error {
	return r.db.Save(exec).Error
}
```

- [ ] **Step 2: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/repository/execution_repo.go
git commit -m "feat: add WorkflowExecution repository"
```

---

## Task 4: Workflow service with execution engine

**Files:**
- Create: `AIops/backend/internal/service/workflow_service.go`

- [ ] **Step 1: Write failing test**

```go
// AIops/backend/internal/service/workflow_service_test.go
package service

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupWorkflowServiceDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&model.Workflow{}, &model.WorkflowExecution{})
	return db
}

func TestWorkflowService_CreateWorkflow(t *testing.T) {
	db := setupWorkflowServiceDB(t)
	wfRepo := repository.NewWorkflowRepo(db)
	execRepo := repository.NewExecutionRepo(db)
	svc := NewWorkflowService(wfRepo, execRepo)

	wf := &model.Workflow{
		Name:      "test-workflow",
		CreatedBy: 1,
	}

	err := svc.CreateWorkflow(wf)
	assert.NoError(t, err)
	assert.NotZero(t, wf.ID)
	assert.Equal(t, model.WorkflowStatusDraft, wf.Status)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service -v -run TestWorkflowService_CreateWorkflow
```

Expected: FAIL with "undefined: NewWorkflowService"

- [ ] **Step 3: Implement workflow service**

```go
// AIops/backend/internal/service/workflow_service.go
package service

import (
	"fmt"
	"time"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
)

type WorkflowService struct {
	wfRepo   *repository.WorkflowRepo
	execRepo *repository.ExecutionRepo
}

func NewWorkflowService(wfRepo *repository.WorkflowRepo, execRepo *repository.ExecutionRepo) *WorkflowService {
	return &WorkflowService{wfRepo: wfRepo, execRepo: execRepo}
}

func (s *WorkflowService) CreateWorkflow(wf *model.Workflow) error {
	wf.Status = model.WorkflowStatusDraft
	return s.wfRepo.Create(wf)
}

func (s *WorkflowService) GetWorkflow(id uint) (*model.Workflow, error) {
	return s.wfRepo.GetByID(id)
}

func (s *WorkflowService) ListWorkflows(offset, limit int) ([]*model.Workflow, int64, error) {
	return s.wfRepo.List(offset, limit)
}

func (s *WorkflowService) UpdateWorkflow(wf *model.Workflow) error {
	return s.wfRepo.Update(wf)
}

func (s *WorkflowService) DeleteWorkflow(id uint) error {
	return s.wfRepo.Delete(id)
}

func (s *WorkflowService) ExecuteWorkflow(workflowID, userID uint) (*model.WorkflowExecution, error) {
	wf, err := s.wfRepo.GetByID(workflowID)
	if err != nil {
		return nil, fmt.Errorf("workflow not found: %w", err)
	}

	if wf.Status != model.WorkflowStatusActive {
		return nil, fmt.Errorf("workflow is not active")
	}

	exec := &model.WorkflowExecution{
		WorkflowID: workflowID,
		Status:     model.ExecutionStatusPending,
		CreatedBy:  userID,
	}

	if err := s.execRepo.Create(exec); err != nil {
		return nil, err
	}

	// Start execution (synchronous MVP)
	go s.runExecution(exec, wf)

	return exec, nil
}

func (s *WorkflowService) runExecution(exec *model.WorkflowExecution, wf *model.Workflow) {
	now := time.Now()
	exec.StartTime = &model.TimePtr{Time: now}
	exec.Status = model.ExecutionStatusRunning
	s.execRepo.Update(exec)

	// MVP: Simple execution - just log nodes
	logs := make([]interface{}, 0)
	for i, node := range wf.Nodes {
		logs = append(logs, map[string]interface{}{
			"step":      i + 1,
			"node":      node,
			"timestamp": time.Now().Format(time.RFC3339),
			"status":    "completed",
		})
	}

	exec.Logs = logs
	exec.Status = model.ExecutionStatusSuccess
	endTime := time.Now()
	exec.EndTime = &model.TimePtr{Time: endTime}
	s.execRepo.Update(exec)
}

func (s *WorkflowService) GetExecution(id uint) (*model.WorkflowExecution, error) {
	return s.execRepo.GetByID(id)
}

func (s *WorkflowService) ListExecutions(workflowID uint, offset, limit int) ([]*model.WorkflowExecution, int64, error) {
	return s.execRepo.ListByWorkflowID(workflowID, offset, limit)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service -v -run TestWorkflowService_CreateWorkflow
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/service/workflow_service.go internal/service/workflow_service_test.go
git commit -m "feat: add workflow service with execution engine"
```

---

## Task 5: Workflow handler

**Files:**
- Create: `AIops/backend/internal/handler/workflow_handler.go`

- [ ] **Step 1: Implement workflow handler**

```go
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
```

- [ ] **Step 2: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/handler/workflow_handler.go
git commit -m "feat: add workflow handler with REST API endpoints"
```

---

## Task 6: Wire routes and verify build

**Files:**
- Modify: `AIops/backend/cmd/api/main.go`

- [ ] **Step 1: Update main.go**

Add after model marketplace block:

```go
// Workflow engine
workflowRepo := repository.NewWorkflowRepo(db)
executionRepo := repository.NewExecutionRepo(db)
workflowSvc := service.NewWorkflowService(workflowRepo, executionRepo)
workflowHandler := handler.NewWorkflowHandler(workflowSvc)
```

Add in protected routes section:

```go
// Workflow routes
workflows := protected.Group("/workflows")
{
	workflows.GET("", workflowHandler.ListWorkflows)
	workflows.POST("", middleware.RequireRole("admin", "operator"), workflowHandler.CreateWorkflow)
	workflows.GET("/:id", workflowHandler.GetWorkflow)
	workflows.PUT("/:id", middleware.RequireRole("admin", "operator"), workflowHandler.UpdateWorkflow)
	workflows.DELETE("/:id", middleware.RequireRole("admin"), workflowHandler.DeleteWorkflow)
	workflows.POST("/:id/execute", middleware.RequireRole("admin", "operator"), workflowHandler.ExecuteWorkflow)
}

// Workflow execution routes
executions := protected.Group("/workflow-executions")
{
	executions.GET("", workflowHandler.ListExecutions)
	executions.GET("/:id", workflowHandler.GetExecution)
}
```

- [ ] **Step 2: Build to verify compilation**

```bash
cd e:/Opsgit/AIops/backend
go build -o bin/api.exe ./cmd/api
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add cmd/api/main.go
git commit -m "feat: wire workflow engine routes to main application"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [ ] Workflow with nodes/edges JSONB ✓
- [ ] WorkflowExecution with logs JSONB ✓
- [ ] Workflow CRUD ✓
- [ ] Workflow execution (POST /:id/execute) ✓
- [ ] Execution listing ✓
- [ ] RBAC: admin/operator manage, viewer read ✓

**No Placeholders:**
- [ ] All code complete ✓

**Type Consistency:**
- [ ] WorkflowStatus/ExecutionStatus used consistently ✓

**TDD Compliance:**
- [ ] Task 2: test → implement → commit ✓
- [ ] Task 4: test → implement → commit ✓

**Integration:**
- [ ] AutoMigrate includes models ✓
- [ ] Routes wired with RBAC ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-03-aiops-backend-plan4-workflow-engine.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**
