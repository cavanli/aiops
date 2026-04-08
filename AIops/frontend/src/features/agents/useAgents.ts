import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { agentsApi } from '@/api/agents'
import type { CreateAgentRequest, UpdateAgentRequest } from '@/types/agent'

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () =>
      agentsApi.list({ page: 1, page_size: 100 }).then((r) => r.data.data),
  })
}

export function useCreateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAgentRequest) => agentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] })
      message.success('智能体创建成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useUpdateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAgentRequest }) =>
      agentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] })
      message.success('智能体更新成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useDeleteAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => agentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] })
      message.success('智能体删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}
