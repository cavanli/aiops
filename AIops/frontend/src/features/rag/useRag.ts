import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { ragApi } from '../../api/rag'
import type { CreateDataSourceRequest, UpdateDataSourceRequest, VectorSearchRequest } from '../../types/rag'

export function useDataSources(type?: string) {
  return useQuery({
    queryKey: ['rag-sources', type],
    queryFn: () => ragApi.listDataSources({ page: 1, page_size: 100, type }).then(r => r.data.data),
  })
}

export function useDataSource(id: number) {
  return useQuery({
    queryKey: ['rag-sources', id],
    queryFn: () => ragApi.getDataSource(id).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useCreateDataSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDataSourceRequest) => ragApi.createDataSource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-sources'] })
      message.success('数据源创建成功')
    },
    onError: () => message.error('创建失败，请重试'),
  })
}

export function useUpdateDataSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDataSourceRequest }) =>
      ragApi.updateDataSource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-sources'] })
      message.success('数据源更新成功')
    },
    onError: () => message.error('更新失败，请重试'),
  })
}

export function useDeleteDataSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ragApi.deleteDataSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-sources'] })
      message.success('数据源删除成功')
    },
    onError: () => message.error('删除失败，请重试'),
  })
}

export function useSyncDataSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ragApi.syncDataSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-sources'] })
      message.success('同步已启动')
    },
    onError: () => message.error('同步失败，请重试'),
  })
}

export function useVectorSearch() {
  return useMutation({
    mutationFn: (data: VectorSearchRequest) => ragApi.vectorSearch(data).then(r => r.data.data),
    onError: () => message.error('搜索失败，请重试'),
  })
}
