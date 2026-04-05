import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { deploymentsApi } from '@/api/deployments'
import type { UpdateTemplateRequest } from '@/types/deployment'

// Templates

export function useTemplates() {
  return useQuery({
    queryKey: ['deployment-templates'],
    queryFn: () => deploymentsApi.listTemplates().then((r) => r.data.data),
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.createTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deployment-templates'] })
      message.success('模板创建成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTemplateRequest }) =>
      deploymentsApi.updateTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deployment-templates'] })
      message.success('模板更新成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.deleteTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deployment-templates'] })
      message.success('模板删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

// Tasks

export function useTasks() {
  return useQuery({
    queryKey: ['deployment-tasks'],
    queryFn: () => deploymentsApi.listTasks().then((r) => r.data.data),
  })
}

export function useTaskPolling(id: number) {
  return useQuery({
    queryKey: ['deployment-tasks', id],
    queryFn: () => deploymentsApi.getTask(id).then((r) => r.data.data),
    enabled: id > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'running' || status === 'pending' ? 3000 : false
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deployment-tasks'] })
      message.success('部署任务已创建')
    },
    onError: () => message.error('创建失败，请重试'),
  })
}

export function useCancelTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.cancelTask,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['deployment-tasks'] })
      qc.invalidateQueries({ queryKey: ['deployment-tasks', id] })
      message.success('任务已取消')
    },
    onError: () => message.error('取消失败，请重试'),
  })
}
