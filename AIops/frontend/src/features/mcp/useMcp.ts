import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { mcpApi } from '../../api/mcp'
import type { CreateMcpServerRequest, UpdateMcpServerRequest } from '../../types/mcp'

export function useMcpServers() {
  return useQuery({
    queryKey: ['mcp-servers'],
    queryFn: () => mcpApi.list({ page: 1, page_size: 100 }).then(r => r.data.data),
    refetchInterval: 10_000,
  })
}

export function useCreateMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMcpServerRequest) => mcpApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] })
      message.success('MCP 服务创建成功')
    },
    onError: () => message.error('创建失败，请重试'),
  })
}

export function useUpdateMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMcpServerRequest }) =>
      mcpApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] })
      message.success('MCP 服务更新成功')
    },
    onError: () => message.error('更新失败，请重试'),
  })
}

export function useDeleteMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => mcpApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] })
      message.success('MCP 服务删除成功')
    },
    onError: () => message.error('删除失败，请重试'),
  })
}

export function useStartMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => mcpApi.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] })
      message.success('MCP 服务已启动')
    },
    onError: () => message.error('启动失败，请重试'),
  })
}

export function useStopMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => mcpApi.stop(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] })
      message.success('MCP 服务已停止')
    },
    onError: () => message.error('停止失败，请重试'),
  })
}

export function useRestartMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => mcpApi.restart(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] })
      message.success('MCP 服务已重启')
    },
    onError: () => message.error('重启失败，请重试'),
  })
}
