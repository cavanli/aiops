import client from './client'
import type { ApiResponse } from '@/types/auth'
import type {
  DeploymentTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  DeploymentTask,
  CreateTaskRequest,
} from '@/types/deployment'

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export const deploymentsApi = {
  // Templates — backend: /api/v1/deployment-templates
  listTemplates: () =>
    client.get<ApiResponse<PaginatedResponse<DeploymentTemplate>>>('/api/v1/deployment-templates'),
  getTemplate: (id: number) =>
    client.get<ApiResponse<DeploymentTemplate>>(`/api/v1/deployment-templates/${id}`),
  createTemplate: (data: CreateTemplateRequest) =>
    client.post<ApiResponse<DeploymentTemplate>>('/api/v1/deployment-templates', data),
  updateTemplate: (id: number, data: UpdateTemplateRequest) =>
    client.put<ApiResponse<DeploymentTemplate>>(`/api/v1/deployment-templates/${id}`, data),
  deleteTemplate: (id: number) =>
    client.delete(`/api/v1/deployment-templates/${id}`),

  // Tasks — backend: /api/v1/deployments
  listTasks: () =>
    client.get<ApiResponse<PaginatedResponse<DeploymentTask>>>('/api/v1/deployments'),
  getTask: (id: number) =>
    client.get<ApiResponse<DeploymentTask>>(`/api/v1/deployments/${id}`),
  createTask: (data: CreateTaskRequest) =>
    client.post<ApiResponse<DeploymentTask>>('/api/v1/deployments', data),
  cancelTask: (id: number) =>
    client.post(`/api/v1/deployments/${id}/cancel`),
}
