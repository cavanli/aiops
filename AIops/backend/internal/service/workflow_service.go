// AIops/backend/internal/service/workflow_service.go
package service

import (
	"fmt"
	"time"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
)

type WorkflowService struct {
	wfRepo   *repository.WorkflowRepo
	execRepo *repository.ExecutionRepo
}

func NewWorkflowService(wfRepo *repository.WorkflowRepo, execRepo *repository.ExecutionRepo) *WorkflowService {
	return &WorkflowService{wfRepo: wfRepo, execRepo: execRepo}
}

func (s *WorkflowService) CreateWorkflow(wf *model.Workflow) error {
	wf.Status = model.WorkflowStatusDraft
	return s.wfRepo.Create(wf)
}

func (s *WorkflowService) GetWorkflow(id uint) (*model.Workflow, error) {
	return s.wfRepo.GetByID(id)
}

func (s *WorkflowService) ListWorkflows(offset, limit int) ([]*model.Workflow, int64, error) {
	return s.wfRepo.List(offset, limit)
}

func (s *WorkflowService) UpdateWorkflow(wf *model.Workflow) error {
	return s.wfRepo.Update(wf)
}

func (s *WorkflowService) DeleteWorkflow(id uint) error {
	return s.wfRepo.Delete(id)
}

func (s *WorkflowService) ExecuteWorkflow(workflowID, userID uint) (*model.WorkflowExecution, error) {
	wf, err := s.wfRepo.GetByID(workflowID)
	if err != nil {
		return nil, fmt.Errorf("workflow not found: %w", err)
	}

	if wf.Status != model.WorkflowStatusActive {
		return nil, fmt.Errorf("workflow is not active")
	}

	exec := &model.WorkflowExecution{
		WorkflowID: workflowID,
		Status:     model.ExecutionStatusPending,
		CreatedBy:  userID,
	}

	if err := s.execRepo.Create(exec); err != nil {
		return nil, err
	}

	// Start execution (synchronous MVP)
	go s.runExecution(exec, wf)

	return exec, nil
}

func (s *WorkflowService) runExecution(exec *model.WorkflowExecution, wf *model.Workflow) {
	now := time.Now()
	exec.StartTime = &model.TimePtr{Time: now}
	exec.Status = model.ExecutionStatusRunning
	s.execRepo.Update(exec)

	// MVP: Simple execution - just log nodes
	logs := make([]interface{}, 0)
	for i, node := range wf.Nodes {
		logs = append(logs, map[string]interface{}{
			"step":      i + 1,
			"node":      node,
			"timestamp": time.Now().Format(time.RFC3339),
			"status":    "completed",
		})
	}

	exec.Logs = logs
	exec.Status = model.ExecutionStatusSuccess
	endTime := time.Now()
	exec.EndTime = &model.TimePtr{Time: endTime}
	s.execRepo.Update(exec)
}

func (s *WorkflowService) GetExecution(id uint) (*model.WorkflowExecution, error) {
	return s.execRepo.GetByID(id)
}

func (s *WorkflowService) ListExecutions(workflowID uint, offset, limit int) ([]*model.WorkflowExecution, int64, error) {
	return s.execRepo.ListByWorkflowID(workflowID, offset, limit)
}
