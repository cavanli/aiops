import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { DashboardStats } from '@/types/deployment'
import type { DeploymentTask } from '@/types/deployment'

export const dashboardApi = {
  getStats: () =>
    client.get<ApiResponse<DashboardStats>>('/api/v1/dashboard/stats'),
  getRecentTasks: () =>
    client.get<ApiResponse<DeploymentTask[]>>(
      '/api/v1/deployments/tasks?limit=10&sort=created_at:desc'
    ),
}
