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
