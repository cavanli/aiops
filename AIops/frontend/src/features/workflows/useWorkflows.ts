import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { workflowsApi } from '@/api/workflows'
import type { UpdateWorkflowRequest } from '@/types/workflow'

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list().then((r) => r.data.data.items),
  })
}

export function useWorkflow(id: number) {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: () => workflowsApi.get(id).then((r) => r.data.data),
    enabled: id > 0,
  })
}

export function useCreateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: workflowsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      message.success('工作流创建成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useUpdateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWorkflowRequest }) =>
      workflowsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      qc.invalidateQueries({ queryKey: ['workflows', id] })
    },
    onError: () => message.error('保存失败，请重试'),
  })
}

export function useDeleteWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: workflowsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      message.success('工作流删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useExecuteWorkflow() {
  return useMutation({
    mutationFn: workflowsApi.execute,
    onSuccess: () => message.success('工作流已开始执行'),
    onError: () => message.error('执行失败，请重试'),
  })
}
