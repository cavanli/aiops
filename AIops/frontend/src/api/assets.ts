import client from './client'
import type { ApiResponse, PaginatedResponse } from './client'
import type { Asset, CreateAssetRequest, UpdateAssetRequest } from '../types/asset'

export const assetsApi = {
  list: (params?: { page?: number; page_size?: number; type?: string; source?: string }) =>
    client.get<ApiResponse<PaginatedResponse<Asset>>>('/api/v1/assets', { params }),

  get: (id: number) =>
    client.get<ApiResponse<Asset>>(`/api/v1/assets/${id}`),

  create: (data: CreateAssetRequest) =>
    client.post<ApiResponse<Asset>>('/api/v1/assets', data),

  update: (id: number, data: UpdateAssetRequest) =>
    client.put<ApiResponse<Asset>>(`/api/v1/assets/${id}`, data),

  delete: (id: number) =>
    client.delete(`/api/v1/assets/${id}`),

  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<ApiResponse<Asset>>('/api/v1/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  loadLocal: (path: string) =>
    client.post<ApiResponse<Asset>>('/api/v1/assets/load-local', { path }),
}
