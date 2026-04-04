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
