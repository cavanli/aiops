// AIops/backend/internal/handler/model_handler.go
package handler

import (
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
