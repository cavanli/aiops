import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { modelsApi } from '@/api/models'
import type { UpdateModelRequest } from '@/types/model'

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: () => modelsApi.list().then((r) => r.data.data.items),
  })
}

export function useCreateModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: modelsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
      message.success('模型添加成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useUpdateModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateModelRequest }) =>
      modelsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
      message.success('模型更新成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useDeleteModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: modelsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
      message.success('模型删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}
