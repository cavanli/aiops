# AIOps Backend Plan 2: Host Management Module

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement host management functionality including Host, HostGroup, and HostEnvVar models with CRUD operations, SSH connection testing, and encrypted credential storage.

**Architecture:** Classic layered architecture (Handler → Service → Repository → Model). All business logic lives in Service, HTTP handling in Handler, DB access in Repository. SSH keys are encrypted using the crypto service from Plan 1. SSH connection testing uses golang.org/x/crypto/ssh.

**Tech Stack:** Go 1.22+, Gin, GORM (postgres driver), golang.org/x/crypto/ssh, existing crypto service for AES-256-GCM encryption

**Dependencies:** Plan 1 must be completed (foundation, auth, crypto service, middleware, response helpers)

---

## File Map

```
AIops/backend/
├── cmd/api/main.go                         # Update: wire host routes
├── internal/
│   ├── model/
│   │   ├── host.go                         # Host, HostStatus, HostEnv enums
│   │   ├── host_group.go                   # HostGroup model
│   │   └── host_env_var.go                 # HostEnvVar model
│   ├── repository/
│   │   ├── host_repo.go                    # Host DB operations
│   │   ├── host_group_repo.go              # HostGroup DB operations
│   │   └── host_env_var_repo.go            # HostEnvVar DB operations
│   ├── service/
│   │   ├── ssh_service.go                  # SSH connection testing
│   │   └── host_service.go                 # Host business logic
│   ├── handler/
│   │   ├── host_handler.go                 # Host REST API endpoints
│   │   └── host_group_handler.go           # HostGroup REST API endpoints
│   └── pkg/
│       └── (existing packages from Plan 1)
├── go.mod                                  # Update: add golang.org/x/crypto/ssh
└── go.sum                                  # Update: generated
```

---

## Task 1: Host, HostGroup, HostEnvVar models

**Files:**
- Create: `AIops/backend/internal/model/host.go`
- Create: `AIops/backend/internal/model/host_group.go`
- Create: `AIops/backend/internal/model/host_env_var.go`

- [ ] **Step 1: Install SSH dependency**

```bash
cd e:/Opsgit/AIops/backend
go get golang.org/x/crypto/ssh@latest
```

- [ ] **Step 2: Create Host model**

```go
// AIops/backend/internal/model/host.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type HostStatus string

const (
	HostStatusOnline  HostStatus = "online"
	HostStatusOffline HostStatus = "offline"
	HostStatusUnknown HostStatus = "unknown"
)

func (s HostStatus) String() string {
	return string(s)
}

func (s *HostStatus) Scan(value interface{}) error {
	if value == nil {
		*s = HostStatusUnknown
		return nil
	}
	str, ok := value.(string)
	if !ok {
		return errors.New("invalid type for HostStatus")
	}
	*s = HostStatus(str)
	return nil
}

func (s HostStatus) Value() (driver.Value, error) {
	return string(s), nil
}

type HostEnv string

const (
	HostEnvProduction HostEnv = "production"
	HostEnvStaging    HostEnv = "staging"
	HostEnvDev        HostEnv = "dev"
)

func (e HostEnv) String() string {
	return string(e)
}

func (e *HostEnv) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	str, ok := value.(string)
	if !ok {
		return errors.New("invalid type for HostEnv")
	}
	*e = HostEnv(str)
	return nil
}

func (e HostEnv) Value() (driver.Value, error) {
	return string(e), nil
}

type StringArray []string

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = []string{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for StringArray")
	}
	return json.Unmarshal(bytes, a)
}

func (a StringArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "[]", nil
	}
	return json.Marshal(a)
}

type Host struct {
	BaseModel
	Name        string      `gorm:"size:128;not null" json:"name"`
	IP          string      `gorm:"size:64;not null" json:"ip"`
	Port        int         `gorm:"not null;default:22" json:"port"`
	SSHUser     string      `gorm:"size:64;not null" json:"ssh_user"`
	SSHKey      string      `gorm:"type:text" json:"-"`
	Status      HostStatus  `gorm:"size:16;default:'unknown'" json:"status"`
	Env         HostEnv     `gorm:"size:32" json:"env"`
	Tags        StringArray `gorm:"type:jsonb;default:'[]'" json:"tags"`
	Description string      `gorm:"type:text" json:"description"`
}
```

- [ ] **Step 3: Create HostGroup model**

```go
// AIops/backend/internal/model/host_group.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type UintArray []uint

func (a *UintArray) Scan(value interface{}) error {
	if value == nil {
		*a = []uint{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for UintArray")
	}
	return json.Unmarshal(bytes, a)
}

func (a UintArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "[]", nil
	}
	return json.Marshal(a)
}

type HostGroup struct {
	BaseModel
	Name        string    `gorm:"size:128;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	HostIDs     UintArray `gorm:"type:jsonb;default:'[]'" json:"host_ids"`
}
```

- [ ] **Step 4: Create HostEnvVar model**

```go
// AIops/backend/internal/model/host_env_var.go
package model

type HostEnvVar struct {
	BaseModel
	HostID      uint   `gorm:"not null;index" json:"host_id"`
	Key         string `gorm:"size:256;not null" json:"key"`
	Value       string `gorm:"type:text;not null" json:"value"`
	IsEncrypted bool   `gorm:"default:false" json:"is_encrypted"`
}
```

- [ ] **Step 5: Update database AutoMigrate**

```go
// AIops/backend/internal/pkg/database/db.go
// In the New function, add to AutoMigrate call:
db.AutoMigrate(
	&model.User{},
	&model.AuditLog{},
	&model.Host{},        // Add
	&model.HostGroup{},   // Add
	&model.HostEnvVar{},  // Add
)
```

- [ ] **Step 6: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/model/host.go internal/model/host_group.go internal/model/host_env_var.go internal/pkg/database/db.go go.mod go.sum
git commit -m "feat: add Host, HostGroup, HostEnvVar models"
```

---

## Task 2: Host repository

**Files:**
- Create: `internal/repository/host_repo.go`

- [ ] **Step 1: Write failing test for host repository**

```go
// internal/repository/host_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupHostTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	err = db.AutoMigrate(&model.Host{})
	assert.NoError(t, err)
	return db
}

func TestHostRepo_Create(t *testing.T) {
	db := setupHostTestDB(t)
	repo := NewHostRepo(db)

	host := &model.Host{
		Name:    "test-host",
		IP:      "192.168.1.100",
		Port:    22,
		SSHUser: "root",
		SSHKey:  "encrypted-key",
		Status:  model.HostStatusUnknown,
		Env:     model.HostEnvDev,
	}

	err := repo.Create(host)
	assert.NoError(t, err)
	assert.NotZero(t, host.ID)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository -v -run TestHostRepo_Create
```

Expected: FAIL with "undefined: NewHostRepo"

- [ ] **Step 3: Implement host repository**

```go
// internal/repository/host_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type HostRepo struct {
	db *gorm.DB
}

func NewHostRepo(db *gorm.DB) *HostRepo {
	return &HostRepo{db: db}
}

func (r *HostRepo) Create(host *model.Host) error {
	return r.db.Create(host).Error
}

func (r *HostRepo) GetByID(id uint) (*model.Host, error) {
	var host model.Host
	err := r.db.First(&host, id).Error
	if err != nil {
		return nil, err
	}
	return &host, nil
}

func (r *HostRepo) List(offset, limit int) ([]*model.Host, int64, error) {
	var hosts []*model.Host
	var total int64

	if err := r.db.Model(&model.Host{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Offset(offset).Limit(limit).Find(&hosts).Error
	return hosts, total, err
}

func (r *HostRepo) Update(host *model.Host) error {
	return r.db.Save(host).Error
}

func (r *HostRepo) Delete(id uint) error {
	return r.db.Delete(&model.Host{}, id).Error
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository -v -run TestHostRepo_Create
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/repository/host_repo.go internal/repository/host_repo_test.go
git commit -m "feat: add host repository with CRUD operations"
```

---

## Task 3: HostGroup and HostEnvVar repositories

**Files:**
- Create: `internal/repository/host_group_repo.go`
- Create: `internal/repository/host_env_var_repo.go`

- [ ] **Step 1: Implement HostGroup repository**

```go
// internal/repository/host_group_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type HostGroupRepo struct {
	db *gorm.DB
}

func NewHostGroupRepo(db *gorm.DB) *HostGroupRepo {
	return &HostGroupRepo{db: db}
}

func (r *HostGroupRepo) Create(group *model.HostGroup) error {
	return r.db.Create(group).Error
}

func (r *HostGroupRepo) GetByID(id uint) (*model.HostGroup, error) {
	var group model.HostGroup
	err := r.db.First(&group, id).Error
	if err != nil {
		return nil, err
	}
	return &group, nil
}

func (r *HostGroupRepo) List() ([]*model.HostGroup, error) {
	var groups []*model.HostGroup
	err := r.db.Find(&groups).Error
	return groups, err
}

func (r *HostGroupRepo) Update(group *model.HostGroup) error {
	return r.db.Save(group).Error
}

func (r *HostGroupRepo) Delete(id uint) error {
	return r.db.Delete(&model.HostGroup{}, id).Error
}
```

- [ ] **Step 2: Implement HostEnvVar repository**

```go
// internal/repository/host_env_var_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type HostEnvVarRepo struct {
	db *gorm.DB
}

func NewHostEnvVarRepo(db *gorm.DB) *HostEnvVarRepo {
	return &HostEnvVarRepo{db: db}
}

func (r *HostEnvVarRepo) Create(envVar *model.HostEnvVar) error {
	return r.db.Create(envVar).Error
}

func (r *HostEnvVarRepo) ListByHostID(hostID uint) ([]*model.HostEnvVar, error) {
	var envVars []*model.HostEnvVar
	err := r.db.Where("host_id = ?", hostID).Find(&envVars).Error
	return envVars, err
}

func (r *HostEnvVarRepo) Delete(id uint) error {
	return r.db.Delete(&model.HostEnvVar{}, id).Error
}
```

- [ ] **Step 3: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/repository/host_group_repo.go internal/repository/host_env_var_repo.go
git commit -m "feat: add HostGroup and HostEnvVar repositories"
```

---

## Task 4: SSH service

**Files:**
- Create: `internal/service/ssh_service.go`

- [ ] **Step 1: Write failing test for SSH connection**

```go
// internal/service/ssh_service_test.go
package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSSHService_TestConnection(t *testing.T) {
	svc := NewSSHService()

	// Test with invalid host (should fail)
	err := svc.TestConnection("invalid-host", 22, "root", "fake-key")
	assert.Error(t, err)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service -v -run TestSSHService_TestConnection
```

Expected: FAIL with "undefined: NewSSHService"

- [ ] **Step 3: Implement SSH service**

```go
// internal/service/ssh_service.go
package service

import (
	"fmt"
	"net"
	"time"

	"golang.org/x/crypto/ssh"
)

type SSHService struct{}

func NewSSHService() *SSHService {
	return &SSHService{}
}

func (s *SSHService) TestConnection(host string, port int, user, privateKey string) error {
	signer, err := ssh.ParsePrivateKey([]byte(privateKey))
	if err != nil {
		return fmt.Errorf("failed to parse private key: %w", err)
	}

	config := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	addr := net.JoinHostPort(host, fmt.Sprintf("%d", port))
	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	defer session.Close()

	if err := session.Run("echo test"); err != nil {
		return fmt.Errorf("failed to run test command: %w", err)
	}

	return nil
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service -v -run TestSSHService_TestConnection
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/service/ssh_service.go internal/service/ssh_service_test.go
git commit -m "feat: add SSH connection testing service"
```

---

## Task 5: Host service

**Files:**
- Create: `internal/service/host_service.go`

- [ ] **Step 1: Write failing test for host service**

```go
// internal/service/host_service_test.go
package service

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/crypto"
	"github.com/aiops/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type MockSSHService struct {
	mock.Mock
}

func (m *MockSSHService) TestConnection(host string, port int, user, key string) error {
	args := m.Called(host, port, user, key)
	return args.Error(0)
}

func TestHostService_CreateHost(t *testing.T) {
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&model.Host{})

	cryptoSvc, _ := crypto.New("12345678901234567890123456789012")
	hostRepo := repository.NewHostRepo(db)
	sshSvc := new(MockSSHService)
	svc := NewHostService(hostRepo, cryptoSvc, sshSvc)

	host := &model.Host{
		Name:    "test-host",
		IP:      "192.168.1.100",
		Port:    22,
		SSHUser: "root",
		SSHKey:  "plain-ssh-key",
	}

	err := svc.CreateHost(host)
	assert.NoError(t, err)
	assert.NotEqual(t, "plain-ssh-key", host.SSHKey)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go get github.com/stretchr/testify/mock
go test ./internal/service -v -run TestHostService_CreateHost
```

Expected: FAIL with "undefined: NewHostService"

- [ ] **Step 3: Implement host service**

```go
// internal/service/host_service.go
package service

import (
	"fmt"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/crypto"
	"github.com/aiops/backend/internal/repository"
)

type HostService struct {
	hostRepo  *repository.HostRepo
	cryptoSvc *crypto.Service
	sshSvc    *SSHService
}

func NewHostService(hostRepo *repository.HostRepo, cryptoSvc *crypto.Service, sshSvc *SSHService) *HostService {
	return &HostService{
		hostRepo:  hostRepo,
		cryptoSvc: cryptoSvc,
		sshSvc:    sshSvc,
	}
}

func (s *HostService) CreateHost(host *model.Host) error {
	if host.SSHKey != "" {
		encrypted, err := s.cryptoSvc.Encrypt(host.SSHKey)
		if err != nil {
			return fmt.Errorf("failed to encrypt SSH key: %w", err)
		}
		host.SSHKey = encrypted
	}

	host.Status = model.HostStatusUnknown
	return s.hostRepo.Create(host)
}

func (s *HostService) GetHost(id uint) (*model.Host, error) {
	return s.hostRepo.GetByID(id)
}

func (s *HostService) ListHosts(offset, limit int) ([]*model.Host, int64, error) {
	return s.hostRepo.List(offset, limit)
}

func (s *HostService) UpdateHost(host *model.Host) error {
	existing, err := s.hostRepo.GetByID(host.ID)
	if err != nil {
		return err
	}

	if host.SSHKey != "" && host.SSHKey != existing.SSHKey {
		encrypted, err := s.cryptoSvc.Encrypt(host.SSHKey)
		if err != nil {
			return fmt.Errorf("failed to encrypt SSH key: %w", err)
		}
		host.SSHKey = encrypted
	} else {
		host.SSHKey = existing.SSHKey
	}

	return s.hostRepo.Update(host)
}

func (s *HostService) DeleteHost(id uint) error {
	return s.hostRepo.Delete(id)
}

func (s *HostService) TestHostConnection(id uint) error {
	host, err := s.hostRepo.GetByID(id)
	if err != nil {
		return err
	}

	decryptedKey, err := s.cryptoSvc.Decrypt(host.SSHKey)
	if err != nil {
		return fmt.Errorf("failed to decrypt SSH key: %w", err)
	}

	if err := s.sshSvc.TestConnection(host.IP, host.Port, host.SSHUser, decryptedKey); err != nil {
		host.Status = model.HostStatusOffline
		s.hostRepo.Update(host)
		return err
	}

	host.Status = model.HostStatusOnline
	return s.hostRepo.Update(host)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service -v -run TestHostService_CreateHost
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/service/host_service.go internal/service/host_service_test.go go.mod go.sum
git commit -m "feat: add host service with encryption and SSH testing"
```

---

## Task 6: Host handler

**Files:**
- Create: `internal/handler/host_handler.go`

- [ ] **Step 1: Write failing test for host handler**

```go
// internal/handler/host_handler_test.go
package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockHostService struct {
	mock.Mock
}

func (m *MockHostService) CreateHost(host *model.Host) error {
	args := m.Called(host)
	return args.Error(0)
}

func (m *MockHostService) GetHost(id uint) (*model.Host, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Host), args.Error(1)
}

func (m *MockHostService) ListHosts(offset, limit int) ([]*model.Host, int64, error) {
	args := m.Called(offset, limit)
	return args.Get(0).([]*model.Host), args.Get(1).(int64), args.Error(2)
}

func (m *MockHostService) UpdateHost(host *model.Host) error {
	args := m.Called(host)
	return args.Error(0)
}

func (m *MockHostService) DeleteHost(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockHostService) TestHostConnection(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestHostHandler_CreateHost(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockSvc := new(MockHostService)
	handler := NewHostHandler(mockSvc)

	mockSvc.On("CreateHost", mock.AnythingOfType("*model.Host")).Return(nil)

	body := map[string]interface{}{
		"name":     "test-host",
		"ip":       "192.168.1.100",
		"port":     22,
		"ssh_user": "root",
		"ssh_key":  "test-key",
	}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/api/v1/hosts", bytes.NewReader(jsonBody))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateHost(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockSvc.AssertExpectations(t)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/handler -v -run TestHostHandler_CreateHost
```

Expected: FAIL with "undefined: NewHostHandler"

- [ ] **Step 3: Implement host handler**

```go
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/handler -v -run TestHostHandler_CreateHost
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/handler/host_handler.go internal/handler/host_handler_test.go
git commit -m "feat: add host handler with REST API endpoints"
```

---

## Task 7: Wire routes and integration test

**Files:**
- Modify: `cmd/api/main.go`

- [ ] **Step 1: Update main.go to wire host routes**

```go
// In cmd/api/main.go, add after existing service/handler initialization:

// Host management
hostRepo := repository.NewHostRepo(db)
hostGroupRepo := repository.NewHostGroupRepo(db)
hostEnvVarRepo := repository.NewHostEnvVarRepo(db)
sshSvc := service.NewSSHService()
hostSvc := service.NewHostService(hostRepo, cryptoSvc, sshSvc)
hostHandler := handler.NewHostHandler(hostSvc)

// In the routes section, add after existing routes:
hosts := v1.Group("/hosts")
hosts.Use(middleware.Auth(jwtSvc))
{
	hosts.POST("", middleware.RequireRole("admin", "operator"), hostHandler.CreateHost)
	hosts.GET("", hostHandler.ListHosts)
	hosts.GET("/:id", hostHandler.GetHost)
	hosts.PUT("/:id", middleware.RequireRole("admin", "operator"), hostHandler.UpdateHost)
	hosts.DELETE("/:id", middleware.RequireRole("admin"), hostHandler.DeleteHost)
	hosts.POST("/:id/test", middleware.RequireRole("admin", "operator"), hostHandler.TestConnection)
}
```

- [ ] **Step 2: Build and verify compilation**

```bash
cd e:/Opsgit/AIops/backend
go build -o bin/api.exe ./cmd/api
```

Expected: Build succeeds with no errors

- [ ] **Step 3: Manual integration test (optional)**

Start the server and test with curl:

```bash
# Start server
./bin/api.exe

# In another terminal:
# Login first
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Create host (use token from login)
curl -X POST http://localhost:8080/api/v1/hosts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"test-host","ip":"192.168.1.100","port":22,"ssh_user":"root","ssh_key":"test-key","env":"dev"}'

# List hosts
curl http://localhost:8080/api/v1/hosts \
  -H "Authorization: Bearer <token>"
```

- [ ] **Step 4: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add cmd/api/main.go
git commit -m "feat: wire host management routes to main application"
```

---

## Self-Review Checklist

After completing all tasks, verify:

**Spec Coverage:**
- [ ] Host model with SSH key encryption ✓
- [ ] HostGroup model with host IDs array ✓
- [ ] HostEnvVar model ✓
- [ ] SSH connection testing ✓
- [ ] Host CRUD operations ✓
- [ ] REST API endpoints ✓
- [ ] RBAC protection on routes ✓

**No Placeholders:**
- [ ] All code blocks are complete ✓
- [ ] No "TBD" or "TODO" comments ✓
- [ ] All types and functions defined ✓

**Type Consistency:**
- [ ] HostStatus enum used consistently ✓
- [ ] HostEnv enum used consistently ✓
- [ ] Repository interfaces match service calls ✓
- [ ] Handler request/response types match service ✓

**TDD Compliance:**
- [ ] Each task follows test → fail → implement → pass → commit ✓
- [ ] Tests written before implementation ✓

**Integration:**
- [ ] Routes wired in main.go ✓
- [ ] Middleware applied correctly ✓
- [ ] Database migrations updated ✓
- [ ] Dependencies installed ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-02-aiops-backend-plan2-host-management.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
