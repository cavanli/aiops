import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { Workflow, CreateWorkflowRequest, UpdateWorkflowRequest } from '@/types/workflow'

export const workflowsApi = {
  list: () =>
    client.get<ApiResponse<Workflow[]>>('/api/v1/workflows'),
  get: (id: number) =>
    client.get<ApiResponse<Workflow>>(`/api/v1/workflows/${id}`),
  create: (data: CreateWorkflowRequest) =>
    client.post<ApiResponse<Workflow>>('/api/v1/workflows', data),
  update: (id: number, data: UpdateWorkflowRequest) =>
    client.put<ApiResponse<Workflow>>(`/api/v1/workflows/${id}`, data),
  delete: (id: number) =>
    client.delete(`/api/v1/workflows/${id}`),
  execute: (id: number) =>
    client.post<ApiResponse<{ task_id: number }>>(`/api/v1/workflows/${id}/execute`),
}
