import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { hostsApi } from '@/api/hosts'
import type { UpdateHostRequest } from '@/types/host'

export function useHosts() {
  return useQuery({
    queryKey: ['hosts'],
    queryFn: () => hostsApi.list().then((r) => r.data.data),
  })
}

export function useCreateHost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: hostsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      message.success('主机添加成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useUpdateHost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHostRequest }) =>
      hostsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      message.success('主机更新成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useDeleteHost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: hostsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      message.success('主机删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}
