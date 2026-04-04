import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { Model, CreateModelRequest, UpdateModelRequest, TestModelResult } from '@/types/model'

export const modelsApi = {
  list: () =>
    client.get<ApiResponse<Model[]>>('/api/v1/models'),
  get: (id: number) =>
    client.get<ApiResponse<Model>>(`/api/v1/models/${id}`),
  create: (data: CreateModelRequest) =>
    client.post<ApiResponse<Model>>('/api/v1/models', data),
  update: (id: number, data: UpdateModelRequest) =>
    client.put<ApiResponse<Model>>(`/api/v1/models/${id}`, data),
  delete: (id: number) =>
    client.delete(`/api/v1/models/${id}`),
  testModel: (id: number) =>
    client.post<ApiResponse<TestModelResult>>(`/api/v1/models/${id}/test`),
}
