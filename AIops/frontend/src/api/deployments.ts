import client from './client'
import type { ApiResponse } from '@/types/auth'
import type {
  DeploymentTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  DeploymentTask,
  CreateTaskRequest,
} from '@/types/deployment'

export const deploymentsApi = {
  // Templates
  listTemplates: () =>
    client.get<ApiResponse<DeploymentTemplate[]>>('/api/v1/deployments/templates'),
  getTemplate: (id: number) =>
    client.get<ApiResponse<DeploymentTemplate>>(`/api/v1/deployments/templates/${id}`),
  createTemplate: (data: CreateTemplateRequest) =>
    client.post<ApiResponse<DeploymentTemplate>>('/api/v1/deployments/templates', data),
  updateTemplate: (id: number, data: UpdateTemplateRequest) =>
    client.put<ApiResponse<DeploymentTemplate>>(`/api/v1/deployments/templates/${id}`, data),
  deleteTemplate: (id: number) =>
    client.delete(`/api/v1/deployments/templates/${id}`),

  // Tasks
  listTasks: () =>
    client.get<ApiResponse<DeploymentTask[]>>('/api/v1/deployments/tasks'),
  getTask: (id: number) =>
    client.get<ApiResponse<DeploymentTask>>(`/api/v1/deployments/tasks/${id}`),
  createTask: (data: CreateTaskRequest) =>
    client.post<ApiResponse<DeploymentTask>>('/api/v1/deployments/tasks', data),
  cancelTask: (id: number) =>
    client.post(`/api/v1/deployments/tasks/${id}/cancel`),
}
