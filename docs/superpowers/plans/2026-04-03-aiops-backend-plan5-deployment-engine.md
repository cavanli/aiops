# AIOps Backend Plan 5: Deployment Execution Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Deployment Execution module: DeploymentTemplate CRUD, DeploymentTask creation/listing/cancellation, and an in-process worker pool that executes scripts over SSH with fail_fast/continue_on_failure strategies.

**Architecture:** Classic layered architecture. DeploymentTemplate stores script content and params as JSONB. DeploymentTask uses an in-memory channel-based worker pool (10 workers). Each worker: decrypts SSH key via crypto service → SSH dial → exec script → stream logs → write results. Health check (http/tcp/shell) runs post-script. RBAC: admin/operator execute; viewer reads.

**Tech Stack:** Go 1.22+, Gin, GORM, golang.org/x/crypto/ssh, net/http (health check), existing crypto service

**Dependencies:** Plans 1–4 complete (crypto, SSH service, host repo, middleware).

---

## File Map

```
AIops/backend/
├── internal/
│   ├── model/
│   │   └── deployment.go            # DeploymentTemplate, DeploymentTask structs
│   ├── repository/
│   │   ├── template_repo.go         # DeploymentTemplate DB operations
│   │   └── task_repo.go             # DeploymentTask DB operations
│   ├── service/
│   │   └── deployment_service.go    # Business logic + worker pool executor
│   ├── handler/
│   │   └── deployment_handler.go    # REST API endpoints
│   └── pkg/
│       └── (reuse crypto, ssh_service, host_repo)
└── cmd/api/main.go                  # Wire deployment routes
```

---

## Task 1: DeploymentTemplate and DeploymentTask models

**Files:**
- Create: `AIops/backend/internal/model/deployment.go`

- [ ] **Step 1: Create deployment.go**

```go
// AIops/backend/internal/model/deployment.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type ScriptType string

const (
	ScriptTypeShell          ScriptType = "shell"
	ScriptTypePython         ScriptType = "python"
	ScriptTypeHelm           ScriptType = "helm"
	ScriptTypeDockerCompose  ScriptType = "docker-compose"
)

func (s *ScriptType) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = ScriptType(v)
	}
	return nil
}
func (s ScriptType) Value() (driver.Value, error) { return string(s), nil }

type JSONBMap map[string]interface{}

func (m *JSONBMap) Scan(value interface{}) error {
	if value == nil {
		*m = JSONBMap{}
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for JSONBMap")
	}
	return json.Unmarshal(b, m)
}
func (m JSONBMap) Value() (driver.Value, error) {
	if len(m) == 0 {
		return "{}", nil
	}
	return json.Marshal(m)
}

type DeploymentTemplate struct {
	BaseModel
	Name          string     `gorm:"size:128;not null" json:"name"`
	Description   string     `gorm:"type:text" json:"description"`
	ScriptType    ScriptType `gorm:"size:32;not null" json:"script_type"`
	ScriptContent string     `gorm:"type:text;not null" json:"script_content"`
	Params        JSONBMap   `gorm:"type:jsonb;default:'{}'" json:"params"`
	HealthCheck   JSONBMap   `gorm:"type:jsonb" json:"health_check"`
	CreatedBy     uint       `gorm:"not null;index" json:"created_by"`
}

func (DeploymentTemplate) TableName() string { return "deployment_templates" }

type DeployStrategy string

const (
	DeployStrategyFailFast          DeployStrategy = "fail_fast"
	DeployStrategyContinueOnFailure DeployStrategy = "continue_on_failure"
)

func (s *DeployStrategy) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = DeployStrategy(v)
	}
	return nil
}
func (s DeployStrategy) Value() (driver.Value, error) { return string(s), nil }

type DeployTaskStatus string

const (
	DeployTaskStatusPending   DeployTaskStatus = "pending"
	DeployTaskStatusRunning   DeployTaskStatus = "running"
	DeployTaskStatusSuccess   DeployTaskStatus = "success"
	DeployTaskStatusFailed    DeployTaskStatus = "failed"
	DeployTaskStatusCancelled DeployTaskStatus = "cancelled"
)

func (s *DeployTaskStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = DeployTaskStatus(v)
	}
	return nil
}
func (s DeployTaskStatus) Value() (driver.Value, error) { return string(s), nil }

type DeploymentTask struct {
	BaseModel
	TemplateID uint             `gorm:"index" json:"template_id"`
	HostIDs    UintArray        `gorm:"type:jsonb;not null;default:'[]'" json:"host_ids"`
	Params     JSONBMap         `gorm:"type:jsonb;default:'{}'" json:"params"`
	Strategy   DeployStrategy   `gorm:"size:32;default:'fail_fast'" json:"strategy"`
	Status     DeployTaskStatus `gorm:"size:16;not null;default:'pending'" json:"status"`
	Logs       JSONBArray       `gorm:"type:jsonb;default:'[]'" json:"logs"`
	StartTime  *TimePtr         `json:"start_time"`
	EndTime    *TimePtr         `json:"end_time"`
	CreatedBy  uint             `gorm:"not null;index" json:"created_by"`
}

func (DeploymentTask) TableName() string { return "deployment_tasks" }
```

- [ ] **Step 2: Update AutoMigrate in cmd/api/main.go**

```go
database.AutoMigrate(db,
	&model.User{},
	&model.AuditLog{},
	&model.Host{},
	&model.HostGroup{},
	&model.HostEnvVar{},
	&model.AIModel{},
	&model.APIKey{},
	&model.Workflow{},
	&model.WorkflowExecution{},
	&model.DeploymentTemplate{}, // Add
	&model.DeploymentTask{},     // Add
)
```

- [ ] **Step 3: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/model/deployment.go cmd/api/main.go
git commit -m "feat: add DeploymentTemplate and DeploymentTask models"
```

---

## Task 2: Template and Task repositories

**Files:**
- Create: `AIops/backend/internal/repository/template_repo.go`
- Create: `AIops/backend/internal/repository/task_repo.go`

- [ ] **Step 1: Write failing test for template repo**

```go
// AIops/backend/internal/repository/template_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupDeployTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&model.DeploymentTemplate{}, &model.DeploymentTask{})
	return db
}

func TestTemplateRepo_Create(t *testing.T) {
	db := setupDeployTestDB(t)
	repo := NewTemplateRepo(db)

	tmpl := &model.DeploymentTemplate{
		Name:          "deploy-app",
		ScriptType:    model.ScriptTypeShell,
		ScriptContent: "echo 'deploying'",
		CreatedBy:     1,
	}

	err := repo.Create(tmpl)
	assert.NoError(t, err)
	assert.NotZero(t, tmpl.ID)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository -v -run TestTemplateRepo_Create
```

Expected: FAIL with "undefined: NewTemplateRepo"

- [ ] **Step 3: Implement template repository**

```go
// AIops/backend/internal/repository/template_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type TemplateRepo struct {
	db *gorm.DB
}

func NewTemplateRepo(db *gorm.DB) *TemplateRepo {
	return &TemplateRepo{db: db}
}

func (r *TemplateRepo) Create(t *model.DeploymentTemplate) error {
	return r.db.Create(t).Error
}

func (r *TemplateRepo) GetByID(id uint) (*model.DeploymentTemplate, error) {
	var t model.DeploymentTemplate
	err := r.db.First(&t, id).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TemplateRepo) List(offset, limit int) ([]*model.DeploymentTemplate, int64, error) {
	var templates []*model.DeploymentTemplate
	var total int64
	if err := r.db.Model(&model.DeploymentTemplate{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Offset(offset).Limit(limit).Find(&templates).Error
	return templates, total, err
}

func (r *TemplateRepo) Update(t *model.DeploymentTemplate) error {
	return r.db.Save(t).Error
}

func (r *TemplateRepo) Delete(id uint) error {
	return r.db.Delete(&model.DeploymentTemplate{}, id).Error
}
```

- [ ] **Step 4: Implement task repository**

```go
// AIops/backend/internal/repository/task_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type TaskRepo struct {
	db *gorm.DB
}

func NewTaskRepo(db *gorm.DB) *TaskRepo {
	return &TaskRepo{db: db}
}

func (r *TaskRepo) Create(task *model.DeploymentTask) error {
	return r.db.Create(task).Error
}

func (r *TaskRepo) GetByID(id uint) (*model.DeploymentTask, error) {
	var task model.DeploymentTask
	err := r.db.First(&task, id).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *TaskRepo) List(offset, limit int) ([]*model.DeploymentTask, int64, error) {
	var tasks []*model.DeploymentTask
	var total int64
	if err := r.db.Model(&model.DeploymentTask{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&tasks).Error
	return tasks, total, err
}

func (r *TaskRepo) Update(task *model.DeploymentTask) error {
	return r.db.Save(task).Error
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository -v -run TestTemplateRepo_Create
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/repository/template_repo.go internal/repository/template_repo_test.go internal/repository/task_repo.go
git commit -m "feat: add DeploymentTemplate and DeploymentTask repositories"
```

---

## Task 3: Deployment service with worker pool

**Files:**
- Create: `AIops/backend/internal/service/deployment_service.go`

- [ ] **Step 1: Write failing test**

```go
// AIops/backend/internal/service/deployment_service_test.go
package service

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupDeployServiceDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&model.DeploymentTemplate{}, &model.DeploymentTask{}, &model.Host{})
	return db
}

func TestDeploymentService_CreateTemplate(t *testing.T) {
	db := setupDeployServiceDB(t)
	templateRepo := repository.NewTemplateRepo(db)
	taskRepo := repository.NewTaskRepo(db)
	hostRepo := repository.NewHostRepo(db)
	cryptoSvc, _ := crypto.New("12345678901234567890123456789012")
	svc := NewDeploymentService(templateRepo, taskRepo, hostRepo, cryptoSvc)

	tmpl := &model.DeploymentTemplate{
		Name:          "test-deploy",
		ScriptType:    model.ScriptTypeShell,
		ScriptContent: "echo hello",
		CreatedBy:     1,
	}

	err := svc.CreateTemplate(tmpl)
	assert.NoError(t, err)
	assert.NotZero(t, tmpl.ID)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service -v -run TestDeploymentService_CreateTemplate
```

Expected: FAIL with "undefined: NewDeploymentService"

- [ ] **Step 3: Implement deployment service**

```go
// AIops/backend/internal/service/deployment_service.go
package service

import (
	"bytes"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/crypto"
	"github.com/aiops/backend/internal/repository"
	"golang.org/x/crypto/ssh"
)

const workerPoolSize = 10

type DeploymentService struct {
	templateRepo *repository.TemplateRepo
	taskRepo     *repository.TaskRepo
	hostRepo     *repository.HostRepo
	cryptoSvc    *crypto.Service
}

func NewDeploymentService(
	templateRepo *repository.TemplateRepo,
	taskRepo *repository.TaskRepo,
	hostRepo *repository.HostRepo,
	cryptoSvc *crypto.Service,
) *DeploymentService {
	return &DeploymentService{
		templateRepo: templateRepo,
		taskRepo:     taskRepo,
		hostRepo:     hostRepo,
		cryptoSvc:    cryptoSvc,
	}
}

func (s *DeploymentService) CreateTemplate(t *model.DeploymentTemplate) error {
	return s.templateRepo.Create(t)
}

func (s *DeploymentService) GetTemplate(id uint) (*model.DeploymentTemplate, error) {
	return s.templateRepo.GetByID(id)
}

func (s *DeploymentService) ListTemplates(offset, limit int) ([]*model.DeploymentTemplate, int64, error) {
	return s.templateRepo.List(offset, limit)
}

func (s *DeploymentService) UpdateTemplate(t *model.DeploymentTemplate) error {
	return s.templateRepo.Update(t)
}

func (s *DeploymentService) DeleteTemplate(id uint) error {
	return s.templateRepo.Delete(id)
}

func (s *DeploymentService) GetTask(id uint) (*model.DeploymentTask, error) {
	return s.taskRepo.GetByID(id)
}

func (s *DeploymentService) ListTasks(offset, limit int) ([]*model.DeploymentTask, int64, error) {
	return s.taskRepo.List(offset, limit)
}

func (s *DeploymentService) CreateTask(task *model.DeploymentTask) error {
	task.Status = model.DeployTaskStatusPending
	if err := s.taskRepo.Create(task); err != nil {
		return err
	}
	// Start async execution
	go s.executeTask(task)
	return nil
}

func (s *DeploymentService) CancelTask(id uint) error {
	task, err := s.taskRepo.GetByID(id)
	if err != nil {
		return err
	}
	if task.Status != model.DeployTaskStatusPending && task.Status != model.DeployTaskStatusRunning {
		return fmt.Errorf("task cannot be cancelled in status: %s", task.Status)
	}
	task.Status = model.DeployTaskStatusCancelled
	return s.taskRepo.Update(task)
}

func (s *DeploymentService) executeTask(task *model.DeploymentTask) {
	now := time.Now()
	task.StartTime = &model.TimePtr{Time: now}
	task.Status = model.DeployTaskStatusRunning
	s.taskRepo.Update(task)

	tmpl, err := s.templateRepo.GetByID(task.TemplateID)
	if err != nil {
		s.failTask(task, fmt.Sprintf("template not found: %v", err))
		return
	}

	type hostResult struct {
		hostID uint
		log    string
		err    error
	}

	jobs := make(chan uint, len(task.HostIDs))
	results := make(chan hostResult, len(task.HostIDs))

	// Launch worker pool
	numWorkers := workerPoolSize
	if len(task.HostIDs) < numWorkers {
		numWorkers = len(task.HostIDs)
	}
	for i := 0; i < numWorkers; i++ {
		go func() {
			for hostID := range jobs {
				log, err := s.runOnHost(hostID, tmpl.ScriptContent)
				results <- hostResult{hostID: hostID, log: log, err: err}
			}
		}()
	}

	for _, hid := range task.HostIDs {
		jobs <- hid
	}
	close(jobs)

	logs := make([]interface{}, 0, len(task.HostIDs))
	failed := false

	for range task.HostIDs {
		res := <-results
		entry := map[string]interface{}{
			"host_id":   res.hostID,
			"timestamp": time.Now().Format(time.RFC3339),
			"output":    res.log,
		}
		if res.err != nil {
			entry["error"] = res.err.Error()
			entry["status"] = "failed"
			failed = true
			if task.Strategy == model.DeployStrategyFailFast {
				logs = append(logs, entry)
				break
			}
		} else {
			entry["status"] = "success"
		}
		logs = append(logs, entry)
	}

	task.Logs = logs
	endTime := time.Now()
	task.EndTime = &model.TimePtr{Time: endTime}

	if failed {
		task.Status = model.DeployTaskStatusFailed
	} else {
		task.Status = model.DeployTaskStatusSuccess
		// Run health check if configured
		if len(tmpl.HealthCheck) > 0 {
			if err := s.runHealthCheck(tmpl.HealthCheck); err != nil {
				task.Status = model.DeployTaskStatusFailed
				task.Logs = append(task.Logs, map[string]interface{}{
					"type":      "health_check",
					"timestamp": time.Now().Format(time.RFC3339),
					"error":     err.Error(),
					"status":    "failed",
				})
			}
		}
	}

	s.taskRepo.Update(task)
}

func (s *DeploymentService) runOnHost(hostID uint, script string) (string, error) {
	host, err := s.hostRepo.GetByID(hostID)
	if err != nil {
		return "", fmt.Errorf("host %d not found: %w", hostID, err)
	}

	decryptedKey, err := s.cryptoSvc.Decrypt(host.SSHKey)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt SSH key: %w", err)
	}

	signer, err := ssh.ParsePrivateKey([]byte(decryptedKey))
	if err != nil {
		return "", fmt.Errorf("failed to parse SSH key: %w", err)
	}

	config := &ssh.ClientConfig{
		User:            host.SSHUser,
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         30 * time.Second,
	}

	addr := net.JoinHostPort(host.IP, fmt.Sprintf("%d", host.Port))
	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return "", fmt.Errorf("SSH dial failed: %w", err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("SSH session failed: %w", err)
	}
	defer session.Close()

	var out bytes.Buffer
	session.Stdout = &out
	session.Stderr = &out

	if err := session.Run(script); err != nil {
		return out.String(), fmt.Errorf("script failed: %w", err)
	}
	return out.String(), nil
}

func (s *DeploymentService) runHealthCheck(config model.JSONBMap) error {
	checkType, _ := config["type"].(string)
	target, _ := config["target"].(string)
	timeoutSec, _ := config["timeout"].(float64)
	if timeoutSec == 0 {
		timeoutSec = 30
	}
	timeout := time.Duration(timeoutSec) * time.Second

	switch checkType {
	case "http":
		client := &http.Client{Timeout: timeout}
		resp, err := client.Get(target)
		if err != nil {
			return fmt.Errorf("health check HTTP failed: %w", err)
		}
		resp.Body.Close()
		if resp.StatusCode >= 400 {
			return fmt.Errorf("health check returned %d", resp.StatusCode)
		}
		return nil
	case "tcp":
		conn, err := net.DialTimeout("tcp", target, timeout)
		if err != nil {
			return fmt.Errorf("health check TCP failed: %w", err)
		}
		conn.Close()
		return nil
	default:
		return nil
	}
}

func (s *DeploymentService) failTask(task *model.DeploymentTask, reason string) {
	task.Status = model.DeployTaskStatusFailed
	endTime := time.Now()
	task.EndTime = &model.TimePtr{Time: endTime}
	task.Logs = append(task.Logs, map[string]interface{}{
		"timestamp": time.Now().Format(time.RFC3339),
		"error":     reason,
		"status":    "failed",
	})
	s.taskRepo.Update(task)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service -v -run TestDeploymentService_CreateTemplate
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/service/deployment_service.go internal/service/deployment_service_test.go
git commit -m "feat: add deployment service with worker pool execution engine"
```

---

## Task 4: Deployment handler

**Files:**
- Create: `AIops/backend/internal/handler/deployment_handler.go`

- [ ] **Step 1: Implement deployment handler**

```go
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
```

- [ ] **Step 2: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/handler/deployment_handler.go
git commit -m "feat: add deployment handler with REST API endpoints"
```

---

## Task 5: Wire routes and verify build

**Files:**
- Modify: `AIops/backend/cmd/api/main.go`

- [ ] **Step 1: Update main.go**

Add after workflow engine block:

```go
// Deployment engine
templateRepo := repository.NewTemplateRepo(db)
taskRepo := repository.NewTaskRepo(db)
deploymentSvc := service.NewDeploymentService(templateRepo, taskRepo, hostRepo, cryptoSvc)
deploymentHandler := handler.NewDeploymentHandler(deploymentSvc)
```

Add in protected routes section:

```go
// Deployment template routes
templates := protected.Group("/deployment-templates")
{
	templates.GET("", deploymentHandler.ListTemplates)
	templates.POST("", middleware.RequireRole("admin", "operator"), deploymentHandler.CreateTemplate)
	templates.GET("/:id", deploymentHandler.GetTemplate)
	templates.PUT("/:id", middleware.RequireRole("admin", "operator"), deploymentHandler.UpdateTemplate)
	templates.DELETE("/:id", middleware.RequireRole("admin"), deploymentHandler.DeleteTemplate)
}

// Deployment task routes
deployments := protected.Group("/deployments")
{
	deployments.GET("", deploymentHandler.ListTasks)
	deployments.POST("", middleware.RequireRole("admin", "operator"), deploymentHandler.CreateTask)
	deployments.GET("/:id", deploymentHandler.GetTask)
	deployments.POST("/:id/cancel", middleware.RequireRole("admin", "operator"), deploymentHandler.CancelTask)
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
git commit -m "feat: wire deployment engine routes to main application"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [ ] DeploymentTemplate with CRUD ✓
- [ ] DeploymentTask with HostIDs, strategy, status ✓
- [ ] Worker pool (10 workers, channel-based) ✓
- [ ] fail_fast / continue_on_failure strategies ✓
- [ ] SSH execution (decrypt key → dial → run script) ✓
- [ ] Health check (http/tcp) ✓
- [ ] Cancel task ✓
- [ ] RBAC: admin/operator execute; viewer reads ✓

**No Placeholders:**
- [ ] All code complete ✓

**Type Consistency:**
- [ ] UintArray reused from model package for HostIDs ✓
- [ ] JSONBMap new type for params/health_check ✓
- [ ] JSONBArray reused for logs ✓
- [ ] TimePtr reused from base.go ✓
- [ ] DeploymentServiceInterface matches service methods ✓

**Integration:**
- [ ] AutoMigrate includes new models ✓
- [ ] hostRepo passed from existing Plan 2 initialization ✓
- [ ] cryptoSvc reused from existing initialization ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-03-aiops-backend-plan5-deployment-engine.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**
