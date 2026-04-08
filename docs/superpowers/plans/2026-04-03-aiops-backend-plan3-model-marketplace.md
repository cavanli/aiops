# AIOps Backend Plan 3: Model Marketplace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Model Marketplace module with Model CRUD, API Key management (AES-256-GCM encrypted), and model connection testing.

**Architecture:** Classic layered architecture (Handler → Service → Repository → Model). API keys are encrypted using the existing crypto service. Model testing calls the configured endpoint with a simple probe request. RBAC: admin/operator can manage models; viewer can only read.

**Tech Stack:** Go 1.22+, Gin, GORM, existing crypto service (AES-256-GCM), net/http for model endpoint testing

**Dependencies:** Plan 1 (foundation, crypto service, middleware) and Plan 2 (models pattern) must be complete.

---

## File Map

```
AIops/backend/
├── internal/
│   ├── model/
│   │   └── ai_model.go          # AIModel, APIKey structs + enums
│   ├── repository/
│   │   ├── model_repo.go        # AIModel DB operations
│   │   └── api_key_repo.go      # APIKey DB operations
│   ├── service/
│   │   └── model_service.go     # Business logic, encryption, model test
│   ├── handler/
│   │   └── model_handler.go     # REST API endpoints
│   └── pkg/
│       └── (reuse crypto, response from Plan 1)
└── cmd/api/main.go              # Wire model routes
```

---

## Task 1: AIModel and APIKey models

**Files:**
- Create: `AIops/backend/internal/model/ai_model.go`

- [ ] **Step 1: Create ai_model.go**

```go
// AIops/backend/internal/model/ai_model.go
package model

import "database/sql/driver"

type ModelProvider string

const (
	ModelProviderOpenAI    ModelProvider = "openai"
	ModelProviderAnthropic ModelProvider = "anthropic"
	ModelProviderDeepSeek  ModelProvider = "deepseek"
	ModelProviderQwen      ModelProvider = "qwen"
	ModelProviderCustom    ModelProvider = "custom"
)

func (p *ModelProvider) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*p = ModelProvider(v)
	}
	return nil
}

func (p ModelProvider) Value() (driver.Value, error) { return string(p), nil }

type ModelType string

const (
	ModelTypeChat      ModelType = "chat"
	ModelTypeEmbedding ModelType = "embedding"
)

func (t *ModelType) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*t = ModelType(v)
	}
	return nil
}

func (t ModelType) Value() (driver.Value, error) { return string(t), nil }

type ModelStatus string

const (
	ModelStatusActive   ModelStatus = "active"
	ModelStatusInactive ModelStatus = "inactive"
)

func (s *ModelStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = ModelStatus(v)
	}
	return nil
}

func (s ModelStatus) Value() (driver.Value, error) { return string(s), nil }

type AIModel struct {
	BaseModel
	Name        string        `gorm:"size:128;not null;uniqueIndex" json:"name"`
	Provider    ModelProvider `gorm:"size:64;not null" json:"provider"`
	ModelType   ModelType     `gorm:"size:32;not null" json:"model_type"`
	APIEndpoint string        `gorm:"size:512" json:"api_endpoint"`
	Description string        `gorm:"type:text" json:"description"`
	Status      ModelStatus   `gorm:"size:16;default:'active'" json:"status"`
}

func (AIModel) TableName() string { return "ai_models" }

type APIKeyStatus string

const (
	APIKeyStatusActive   APIKeyStatus = "active"
	APIKeyStatusInactive APIKeyStatus = "inactive"
)

func (s *APIKeyStatus) Scan(value interface{}) error {
	if v, ok := value.(string); ok {
		*s = APIKeyStatus(v)
	}
	return nil
}

func (s APIKeyStatus) Value() (driver.Value, error) { return string(s), nil }

type APIKey struct {
	BaseModel
	ModelID      uint         `gorm:"not null;index" json:"model_id"`
	KeyName      string       `gorm:"size:128;not null" json:"key_name"`
	EncryptedKey string       `gorm:"type:text;not null" json:"-"`
	Quota        int64        `gorm:"default:0" json:"quota"`
	UsedCount    int64        `gorm:"default:0" json:"used_count"`
	Status       APIKeyStatus `gorm:"size:16;default:'active'" json:"status"`
}

func (APIKey) TableName() string { return "api_keys" }
```

- [ ] **Step 2: Update AutoMigrate in database/db.go**

In `AIops/backend/internal/pkg/database/db.go`, find `AutoMigrate` and add the new models. The function currently accepts a variadic `interface{}` slice. Add:

```go
// In cmd/api/main.go, update the AutoMigrate call to include:
database.AutoMigrate(db,
    &model.User{},
    &model.AuditLog{},
    &model.Host{},
    &model.HostGroup{},
    &model.HostEnvVar{},
    &model.AIModel{},   // Add
    &model.APIKey{},    // Add
)
```

- [ ] **Step 3: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/model/ai_model.go cmd/api/main.go
git commit -m "feat: add AIModel and APIKey models"
```

---

## Task 2: Model repository

**Files:**
- Create: `AIops/backend/internal/repository/model_repo.go`

- [ ] **Step 1: Write failing test**

```go
// AIops/backend/internal/repository/model_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupModelTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	err = db.AutoMigrate(&model.AIModel{})
	assert.NoError(t, err)
	return db
}

func TestModelRepo_Create(t *testing.T) {
	db := setupModelTestDB(t)
	repo := NewModelRepo(db)

	m := &model.AIModel{
		Name:      "gpt-4",
		Provider:  model.ModelProviderOpenAI,
		ModelType: model.ModelTypeChat,
		Status:    model.ModelStatusActive,
	}

	err := repo.Create(m)
	assert.NoError(t, err)
	assert.NotZero(t, m.ID)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository -v -run TestModelRepo_Create
```

Expected: FAIL with "undefined: NewModelRepo"

- [ ] **Step 3: Implement model repository**

```go
// AIops/backend/internal/repository/model_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type ModelRepo struct {
	db *gorm.DB
}

func NewModelRepo(db *gorm.DB) *ModelRepo {
	return &ModelRepo{db: db}
}

func (r *ModelRepo) Create(m *model.AIModel) error {
	return r.db.Create(m).Error
}

func (r *ModelRepo) GetByID(id uint) (*model.AIModel, error) {
	var m model.AIModel
	err := r.db.First(&m, id).Error
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ModelRepo) List(offset, limit int) ([]*model.AIModel, int64, error) {
	var models []*model.AIModel
	var total int64
	if err := r.db.Model(&model.AIModel{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Offset(offset).Limit(limit).Find(&models).Error
	return models, total, err
}

func (r *ModelRepo) Update(m *model.AIModel) error {
	return r.db.Save(m).Error
}

func (r *ModelRepo) Delete(id uint) error {
	return r.db.Delete(&model.AIModel{}, id).Error
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository -v -run TestModelRepo_Create
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/repository/model_repo.go internal/repository/model_repo_test.go
git commit -m "feat: add model repository with CRUD operations"
```

---

## Task 3: APIKey repository

**Files:**
- Create: `AIops/backend/internal/repository/api_key_repo.go`

- [ ] **Step 1: Implement APIKey repository**

```go
// AIops/backend/internal/repository/api_key_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type APIKeyRepo struct {
	db *gorm.DB
}

func NewAPIKeyRepo(db *gorm.DB) *APIKeyRepo {
	return &APIKeyRepo{db: db}
}

func (r *APIKeyRepo) Create(k *model.APIKey) error {
	return r.db.Create(k).Error
}

func (r *APIKeyRepo) GetByID(id uint) (*model.APIKey, error) {
	var k model.APIKey
	err := r.db.First(&k, id).Error
	if err != nil {
		return nil, err
	}
	return &k, nil
}

func (r *APIKeyRepo) ListByModelID(modelID uint, offset, limit int) ([]*model.APIKey, int64, error) {
	var keys []*model.APIKey
	var total int64
	if err := r.db.Model(&model.APIKey{}).Where("model_id = ?", modelID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Where("model_id = ?", modelID).Offset(offset).Limit(limit).Find(&keys).Error
	return keys, total, err
}

func (r *APIKeyRepo) Delete(id uint) error {
	return r.db.Delete(&model.APIKey{}, id).Error
}
```

- [ ] **Step 2: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/repository/api_key_repo.go
git commit -m "feat: add APIKey repository"
```

---

## Task 4: Model service

**Files:**
- Create: `AIops/backend/internal/service/model_service.go`

- [ ] **Step 1: Write failing test**

```go
// AIops/backend/internal/service/model_service_test.go
package service

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/crypto"
	"github.com/aiops/backend/internal/repository"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupModelServiceDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&model.AIModel{}, &model.APIKey{})
	return db
}

func TestModelService_CreateModel(t *testing.T) {
	db := setupModelServiceDB(t)
	cryptoSvc, _ := crypto.New("12345678901234567890123456789012")
	modelRepo := repository.NewModelRepo(db)
	apiKeyRepo := repository.NewAPIKeyRepo(db)
	svc := NewModelService(modelRepo, apiKeyRepo, cryptoSvc)

	m := &model.AIModel{
		Name:      "gpt-4",
		Provider:  model.ModelProviderOpenAI,
		ModelType: model.ModelTypeChat,
	}

	err := svc.CreateModel(m)
	assert.NoError(t, err)
	assert.NotZero(t, m.ID)
	assert.Equal(t, model.ModelStatusActive, m.Status)
}

func TestModelService_CreateAPIKey_EncryptsKey(t *testing.T) {
	db := setupModelServiceDB(t)
	cryptoSvc, _ := crypto.New("12345678901234567890123456789012")
	modelRepo := repository.NewModelRepo(db)
	apiKeyRepo := repository.NewAPIKeyRepo(db)
	svc := NewModelService(modelRepo, apiKeyRepo, cryptoSvc)

	// Create parent model first
	m := &model.AIModel{Name: "test", Provider: model.ModelProviderOpenAI, ModelType: model.ModelTypeChat}
	modelRepo.Create(m)

	k := &model.APIKey{
		ModelID: m.ID,
		KeyName: "prod-key",
	}
	plainKey := "sk-test-1234567890"

	err := svc.CreateAPIKey(k, plainKey)
	assert.NoError(t, err)
	assert.NotZero(t, k.ID)
	assert.NotEqual(t, plainKey, k.EncryptedKey)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service -v -run TestModelService_CreateModel
```

Expected: FAIL with "undefined: NewModelService"

- [ ] **Step 3: Implement model service**

```go
// AIops/backend/internal/service/model_service.go
package service

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/crypto"
	"github.com/aiops/backend/internal/repository"
)

type ModelService struct {
	modelRepo  *repository.ModelRepo
	apiKeyRepo *repository.APIKeyRepo
	cryptoSvc  *crypto.Service
}

func NewModelService(modelRepo *repository.ModelRepo, apiKeyRepo *repository.APIKeyRepo, cryptoSvc *crypto.Service) *ModelService {
	return &ModelService{modelRepo: modelRepo, apiKeyRepo: apiKeyRepo, cryptoSvc: cryptoSvc}
}

func (s *ModelService) CreateModel(m *model.AIModel) error {
	m.Status = model.ModelStatusActive
	return s.modelRepo.Create(m)
}

func (s *ModelService) GetModel(id uint) (*model.AIModel, error) {
	return s.modelRepo.GetByID(id)
}

func (s *ModelService) ListModels(offset, limit int) ([]*model.AIModel, int64, error) {
	return s.modelRepo.List(offset, limit)
}

func (s *ModelService) UpdateModel(m *model.AIModel) error {
	return s.modelRepo.Update(m)
}

func (s *ModelService) DeleteModel(id uint) error {
	return s.modelRepo.Delete(id)
}

func (s *ModelService) CreateAPIKey(k *model.APIKey, plainKey string) error {
	encrypted, err := s.cryptoSvc.Encrypt(plainKey)
	if err != nil {
		return fmt.Errorf("failed to encrypt API key: %w", err)
	}
	k.EncryptedKey = encrypted
	k.Status = model.APIKeyStatusActive
	return s.apiKeyRepo.Create(k)
}

func (s *ModelService) ListAPIKeys(modelID uint, offset, limit int) ([]*model.APIKey, int64, error) {
	return s.apiKeyRepo.ListByModelID(modelID, offset, limit)
}

func (s *ModelService) DeleteAPIKey(id uint) error {
	return s.apiKeyRepo.Delete(id)
}

// TestModel probes the model endpoint to verify it is reachable.
// For standard providers (openai/anthropic/etc.), it uses the configured api_endpoint.
// Returns nil on 2xx/4xx (endpoint reachable), error on network failure or 5xx.
func (s *ModelService) TestModel(id uint) error {
	m, err := s.modelRepo.GetByID(id)
	if err != nil {
		return err
	}

	endpoint := m.APIEndpoint
	if endpoint == "" {
		// Default probe endpoints per provider
		switch m.Provider {
		case model.ModelProviderOpenAI:
			endpoint = "https://api.openai.com/v1/models"
		case model.ModelProviderAnthropic:
			endpoint = "https://api.anthropic.com/v1/models"
		case model.ModelProviderDeepSeek:
			endpoint = "https://api.deepseek.com/v1/models"
		case model.ModelProviderQwen:
			endpoint = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
		default:
			return fmt.Errorf("no api_endpoint configured for provider %s", m.Provider)
		}
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(endpoint)
	if err != nil {
		return fmt.Errorf("endpoint unreachable: %w", err)
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)

	if resp.StatusCode >= 500 {
		return fmt.Errorf("endpoint returned server error: %d", resp.StatusCode)
	}
	return nil
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service -v -run "TestModelService_CreateModel|TestModelService_CreateAPIKey_EncryptsKey"
```

Expected: PASS (both tests)

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/service/model_service.go internal/service/model_service_test.go
git commit -m "feat: add model service with API key encryption and endpoint testing"
```

---

## Task 5: Model handler

**Files:**
- Create: `AIops/backend/internal/handler/model_handler.go`

- [ ] **Step 1: Write failing test**

```go
// AIops/backend/internal/handler/model_handler_test.go
package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockModelService struct {
	mock.Mock
}

func (m *MockModelService) CreateModel(mdl *model.AIModel) error {
	args := m.Called(mdl)
	return args.Error(0)
}

func (m *MockModelService) GetModel(id uint) (*model.AIModel, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.AIModel), args.Error(1)
}

func (m *MockModelService) ListModels(offset, limit int) ([]*model.AIModel, int64, error) {
	args := m.Called(offset, limit)
	return args.Get(0).([]*model.AIModel), args.Get(1).(int64), args.Error(2)
}

func (m *MockModelService) UpdateModel(mdl *model.AIModel) error {
	args := m.Called(mdl)
	return args.Error(0)
}

func (m *MockModelService) DeleteModel(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockModelService) CreateAPIKey(k *model.APIKey, plainKey string) error {
	args := m.Called(k, plainKey)
	return args.Error(0)
}

func (m *MockModelService) ListAPIKeys(modelID uint, offset, limit int) ([]*model.APIKey, int64, error) {
	args := m.Called(modelID, offset, limit)
	return args.Get(0).([]*model.APIKey), args.Get(1).(int64), args.Error(2)
}

func (m *MockModelService) DeleteAPIKey(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockModelService) TestModel(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestModelHandler_CreateModel(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mockSvc := new(MockModelService)
	h := NewModelHandler(mockSvc)

	mockSvc.On("CreateModel", mock.AnythingOfType("*model.AIModel")).Return(nil)

	body := map[string]interface{}{
		"name":       "gpt-4",
		"provider":   "openai",
		"model_type": "chat",
	}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/api/v1/models", bytes.NewReader(jsonBody))
	c.Request.Header.Set("Content-Type", "application/json")

	h.CreateModel(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockSvc.AssertExpectations(t)
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/handler -v -run TestModelHandler_CreateModel
```

Expected: FAIL with "undefined: NewModelHandler"

- [ ] **Step 3: Implement model handler**

```go
// AIops/backend/internal/handler/model_handler.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

type ModelServiceInterface interface {
	CreateModel(m *model.AIModel) error
	GetModel(id uint) (*model.AIModel, error)
	ListModels(offset, limit int) ([]*model.AIModel, int64, error)
	UpdateModel(m *model.AIModel) error
	DeleteModel(id uint) error
	CreateAPIKey(k *model.APIKey, plainKey string) error
	ListAPIKeys(modelID uint, offset, limit int) ([]*model.APIKey, int64, error)
	DeleteAPIKey(id uint) error
	TestModel(id uint) error
}

type ModelHandler struct {
	svc ModelServiceInterface
}

func NewModelHandler(svc ModelServiceInterface) *ModelHandler {
	return &ModelHandler{svc: svc}
}

type CreateModelRequest struct {
	Name        string `json:"name" binding:"required"`
	Provider    string `json:"provider" binding:"required,oneof=openai anthropic deepseek qwen custom"`
	ModelType   string `json:"model_type" binding:"required,oneof=chat embedding"`
	APIEndpoint string `json:"api_endpoint"`
	Description string `json:"description"`
}

func (h *ModelHandler) CreateModel(c *gin.Context) {
	var req CreateModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	m := &model.AIModel{
		Name:        req.Name,
		Provider:    model.ModelProvider(req.Provider),
		ModelType:   model.ModelType(req.ModelType),
		APIEndpoint: req.APIEndpoint,
		Description: req.Description,
	}

	if err := h.svc.CreateModel(m); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, m)
}

func (h *ModelHandler) GetModel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid model ID")
		return
	}

	m, err := h.svc.GetModel(uint(id))
	if err != nil {
		response.NotFound(c, "model")
		return
	}
	response.Success(c, m)
}

func (h *ModelHandler) ListModels(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	models, total, err := h.svc.ListModels(offset, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, gin.H{"items": models, "total": total, "page": page, "page_size": pageSize})
}

type UpdateModelRequest struct {
	Name        string `json:"name"`
	Provider    string `json:"provider" binding:"omitempty,oneof=openai anthropic deepseek qwen custom"`
	ModelType   string `json:"model_type" binding:"omitempty,oneof=chat embedding"`
	APIEndpoint string `json:"api_endpoint"`
	Description string `json:"description"`
	Status      string `json:"status" binding:"omitempty,oneof=active inactive"`
}

func (h *ModelHandler) UpdateModel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid model ID")
		return
	}

	var req UpdateModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	m := &model.AIModel{
		BaseModel:   model.BaseModel{ID: uint(id)},
		Name:        req.Name,
		Provider:    model.ModelProvider(req.Provider),
		ModelType:   model.ModelType(req.ModelType),
		APIEndpoint: req.APIEndpoint,
		Description: req.Description,
		Status:      model.ModelStatus(req.Status),
	}

	if err := h.svc.UpdateModel(m); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, m)
}

func (h *ModelHandler) DeleteModel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid model ID")
		return
	}
	if err := h.svc.DeleteModel(uint(id)); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, nil)
}

func (h *ModelHandler) TestModel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid model ID")
		return
	}
	if err := h.svc.TestModel(uint(id)); err != nil {
		response.ExternalServiceError(c, err.Error())
		return
	}
	response.Success(c, gin.H{"message": "model endpoint reachable"})
}

type CreateAPIKeyRequest struct {
	ModelID uint   `json:"model_id" binding:"required"`
	KeyName string `json:"key_name" binding:"required"`
	PlainKey string `json:"plain_key" binding:"required"`
	Quota   int64  `json:"quota"`
}

func (h *ModelHandler) CreateAPIKey(c *gin.Context) {
	var req CreateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	k := &model.APIKey{
		ModelID: req.ModelID,
		KeyName: req.KeyName,
		Quota:   req.Quota,
	}

	if err := h.svc.CreateAPIKey(k, req.PlainKey); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, k)
}

func (h *ModelHandler) ListAPIKeys(c *gin.Context) {
	modelID, err := strconv.ParseUint(c.Query("model_id"), 10, 32)
	if err != nil || modelID == 0 {
		response.InvalidParams(c, "model_id is required")
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

	keys, total, err := h.svc.ListAPIKeys(uint(modelID), offset, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, gin.H{"items": keys, "total": total, "page": page, "page_size": pageSize})
}

func (h *ModelHandler) DeleteAPIKey(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.InvalidParams(c, "invalid key ID")
		return
	}
	if err := h.svc.DeleteAPIKey(uint(id)); err != nil {
		response.InternalError(c)
		return
	}
	response.Success(c, nil)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/handler -v -run TestModelHandler_CreateModel
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add internal/handler/model_handler.go internal/handler/model_handler_test.go
git commit -m "feat: add model handler with REST API endpoints"
```

---

## Task 6: Wire routes in main.go and verify build

**Files:**
- Modify: `AIops/backend/cmd/api/main.go`

- [ ] **Step 1: Update main.go**

Add after the host management block (around line 70):

```go
// Model marketplace
modelRepo := repository.NewModelRepo(db)
apiKeyRepo := repository.NewAPIKeyRepo(db)
modelSvc := service.NewModelService(modelRepo, apiKeyRepo, cryptoSvc)
modelHandler := handler.NewModelHandler(modelSvc)
```

Add in the protected routes section after the hosts block:

```go
// Model marketplace routes
models := protected.Group("/models")
{
    models.GET("", modelHandler.ListModels)
    models.POST("", middleware.RequireRole("admin"), modelHandler.CreateModel)
    models.GET("/:id", modelHandler.GetModel)
    models.PUT("/:id", middleware.RequireRole("admin"), modelHandler.UpdateModel)
    models.DELETE("/:id", middleware.RequireRole("admin"), modelHandler.DeleteModel)
    models.POST("/:id/test", middleware.RequireRole("admin", "operator"), modelHandler.TestModel)
}

// API keys routes
apiKeys := protected.Group("/api-keys")
{
    apiKeys.GET("", modelHandler.ListAPIKeys)
    apiKeys.POST("", middleware.RequireRole("admin"), modelHandler.CreateAPIKey)
    apiKeys.DELETE("/:id", middleware.RequireRole("admin"), modelHandler.DeleteAPIKey)
}
```

Also update the AutoMigrate call (around line 32) to add the new models:

```go
database.AutoMigrate(db,
    &model.User{},
    &model.AuditLog{},
    &model.Host{},
    &model.HostGroup{},
    &model.HostEnvVar{},
    &model.AIModel{},   // Add
    &model.APIKey{},    // Add
)
```

- [ ] **Step 2: Build to verify compilation**

```bash
cd e:/Opsgit/AIops/backend
go build -o bin/api.exe ./cmd/api
```

Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add cmd/api/main.go
git commit -m "feat: wire model marketplace routes to main application"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [ ] AIModel with provider/type/status enums ✓
- [ ] APIKey with AES-256-GCM encrypted key storage ✓
- [ ] Model CRUD (GET/POST/PUT/DELETE) ✓
- [ ] Model connection test (POST /:id/test) ✓
- [ ] API Key CRUD (GET/POST/DELETE) ✓
- [ ] RBAC: admin manages models, operator can test, viewer can list ✓
- [ ] Encrypted key never returned in JSON (json:"-") ✓

**No Placeholders:**
- [ ] All code blocks complete ✓
- [ ] No TBD or TODO ✓

**Type Consistency:**
- [ ] ModelProvider/ModelType/ModelStatus/APIKeyStatus used consistently ✓
- [ ] ModelServiceInterface matches service method signatures ✓
- [ ] Handler request structs match service method parameters ✓

**TDD Compliance:**
- [ ] Task 2: test → fail → implement → pass → commit ✓
- [ ] Task 4: test → fail → implement → pass → commit ✓
- [ ] Task 5: test → fail → implement → pass → commit ✓

**Integration:**
- [ ] AutoMigrate includes AIModel and APIKey ✓
- [ ] Routes wired with correct RBAC ✓
- [ ] model_handler uses interface (MockModelService in tests) ✓

---

## Known Issue: model_handler.go BaseModel reference

In Task 5 Step 3, the `UpdateModel` handler constructs `model.AIModel` with `BaseModel{ID: uint(id)}`. The `BaseModel` type is in the `model` package, so it must be referenced as `model.BaseModel{ID: uint(id)}`. Ensure this is correct in the final file.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-03-aiops-backend-plan3-model-marketplace.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

