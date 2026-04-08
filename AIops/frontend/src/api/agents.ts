import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { Agent, CreateAgentRequest, UpdateAgentRequest } from '@/types/agent'

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export const agentsApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    client.get<ApiResponse<PaginatedResponse<Agent>>>('/api/v1/agents', { params }),
  get: (id: number) =>
    client.get<ApiResponse<Agent>>(`/api/v1/agents/${id}`),
  create: (data: CreateAgentRequest) =>
    client.post<ApiResponse<Agent>>('/api/v1/agents', data),
  update: (id: number, data: UpdateAgentRequest) =>
    client.put<ApiResponse<Agent>>(`/api/v1/agents/${id}`, data),
  delete: (id: number) =>
    client.delete(`/api/v1/agents/${id}`),
}
