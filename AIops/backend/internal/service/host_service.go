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
