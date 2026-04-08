import client from './client'
import type { ApiResponse, PaginatedResponse } from './client'
import type {
  DataSource,
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
  VectorSearchRequest,
  VectorSearchResult,
} from '../types/rag'

export const ragApi = {
  listDataSources: (params?: { page?: number; page_size?: number; type?: string }) =>
    client.get<ApiResponse<PaginatedResponse<DataSource>>>('/api/v1/rag/sources', { params }),

  getDataSource: (id: number) =>
    client.get<ApiResponse<DataSource>>(`/api/v1/rag/sources/${id}`),

  createDataSource: (data: CreateDataSourceRequest) =>
    client.post<ApiResponse<DataSource>>('/api/v1/rag/sources', data),

  updateDataSource: (id: number, data: UpdateDataSourceRequest) =>
    client.put<ApiResponse<DataSource>>(`/api/v1/rag/sources/${id}`, data),

  deleteDataSource: (id: number) =>
    client.delete(`/api/v1/rag/sources/${id}`),

  syncDataSource: (id: number) =>
    client.post<ApiResponse<{ message: string }>>(`/api/v1/rag/sources/${id}/sync`),

  vectorSearch: (data: VectorSearchRequest) =>
    client.post<ApiResponse<VectorSearchResult[]>>('/api/v1/rag/search', data),
}
