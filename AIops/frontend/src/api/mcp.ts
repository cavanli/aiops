import client from './client'
import type { ApiResponse, PaginatedResponse } from './client'
import type { McpServer, CreateMcpServerRequest, UpdateMcpServerRequest } from '../types/mcp'

export const mcpApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    client.get<ApiResponse<PaginatedResponse<McpServer>>>('/api/v1/mcp/servers', { params }),

  get: (id: number) =>
    client.get<ApiResponse<McpServer>>(`/api/v1/mcp/servers/${id}`),

  create: (data: CreateMcpServerRequest) =>
    client.post<ApiResponse<McpServer>>('/api/v1/mcp/servers', data),

  update: (id: number, data: UpdateMcpServerRequest) =>
    client.put<ApiResponse<McpServer>>(`/api/v1/mcp/servers/${id}`, data),

  delete: (id: number) =>
    client.delete(`/api/v1/mcp/servers/${id}`),

  start: (id: number) =>
    client.post<ApiResponse<{ message: string }>>(`/api/v1/mcp/servers/${id}/start`),

  stop: (id: number) =>
    client.post<ApiResponse<{ message: string }>>(`/api/v1/mcp/servers/${id}/stop`),

  restart: (id: number) =>
    client.post<ApiResponse<{ message: string }>>(`/api/v1/mcp/servers/${id}/restart`),
}
