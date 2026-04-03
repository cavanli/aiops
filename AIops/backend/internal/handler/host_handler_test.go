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
