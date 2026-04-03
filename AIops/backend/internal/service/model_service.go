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
