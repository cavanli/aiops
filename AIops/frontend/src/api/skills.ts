import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { Skill, CreateSkillRequest, UpdateSkillRequest } from '@/types/skill'

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export const skillsApi = {
  list: (params?: { page?: number; page_size?: number; category?: string }) =>
    client.get<ApiResponse<PaginatedResponse<Skill>>>('/api/v1/skills', { params }),
  get: (id: number) =>
    client.get<ApiResponse<Skill>>(`/api/v1/skills/${id}`),
  create: (data: CreateSkillRequest) =>
    client.post<ApiResponse<Skill>>('/api/v1/skills', data),
  update: (id: number, data: UpdateSkillRequest) =>
    client.put<ApiResponse<Skill>>(`/api/v1/skills/${id}`, data),
  delete: (id: number) =>
    client.delete(`/api/v1/skills/${id}`),
}
