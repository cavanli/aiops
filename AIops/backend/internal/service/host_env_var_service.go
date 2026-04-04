// internal/service/host_env_var_service.go
package service

import (
	"fmt"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/crypto"
	"github.com/aiops/backend/internal/repository"
)

type HostEnvVarService struct {
	repo      *repository.HostEnvVarRepo
	cryptoSvc *crypto.Service
}

func NewHostEnvVarService(repo *repository.HostEnvVarRepo, cryptoSvc *crypto.Service) *HostEnvVarService {
	return &HostEnvVarService{repo: repo, cryptoSvc: cryptoSvc}
}

func (s *HostEnvVarService) Create(hostID uint, key, value string, encrypt bool) (*model.HostEnvVar, error) {
	storedValue := value
	if encrypt {
		enc, err := s.cryptoSvc.Encrypt(value)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt value: %w", err)
		}
		storedValue = enc
	}
	ev := &model.HostEnvVar{
		HostID:      hostID,
		Key:         key,
		Value:       storedValue,
		IsEncrypted: encrypt,
	}
	if err := s.repo.Create(ev); err != nil {
		return nil, err
	}
	return ev, nil
}

func (s *HostEnvVarService) ListByHost(hostID uint) ([]*model.HostEnvVar, error) {
	return s.repo.ListByHostID(hostID)
}

func (s *HostEnvVarService) Delete(id uint) error {
	return s.repo.Delete(id)
}
