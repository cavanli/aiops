import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { Host, CreateHostRequest, UpdateHostRequest, TestConnectionResult } from '@/types/host'

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export const hostsApi = {
  list: () =>
    client.get<ApiResponse<PaginatedResponse<Host>>>('/api/v1/hosts'),
  get: (id: number) =>
    client.get<ApiResponse<Host>>(`/api/v1/hosts/${id}`),
  create: (data: CreateHostRequest) =>
    client.post<ApiResponse<Host>>('/api/v1/hosts', data),
  update: (id: number, data: UpdateHostRequest) =>
    client.put<ApiResponse<Host>>(`/api/v1/hosts/${id}`, data),
  delete: (id: number) =>
    client.delete(`/api/v1/hosts/${id}`),
  testConnection: (id: number) =>
    client.post<ApiResponse<TestConnectionResult>>(`/api/v1/hosts/${id}/test`),
}
