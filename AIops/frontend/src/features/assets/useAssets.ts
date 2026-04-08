import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { assetsApi } from '../../api/assets'
import type { CreateAssetRequest, UpdateAssetRequest } from '../../types/asset'

export function useAssets(type?: string, source?: string) {
  return useQuery({
    queryKey: ['assets', type, source],
    queryFn: () => assetsApi.list({ page: 1, page_size: 100, type, source }).then(r => r.data.data),
  })
}

export function useAsset(id: number) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => assetsApi.get(id).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAssetRequest) => assetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      message.success('资产创建成功')
    },
    onError: () => message.error('创建失败，请重试'),
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssetRequest }) =>
      assetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      message.success('资产更新成功')
    },
    onError: () => message.error('更新失败，请重试'),
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      message.success('资产删除成功')
    },
    onError: () => message.error('删除失败，请重试'),
  })
}

export function useUploadAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => assetsApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      message.success('上传成功')
    },
    onError: () => message.error('上传失败，请重试'),
  })
}

export function useLoadLocalAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (path: string) => assetsApi.loadLocal(path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      message.success('本地目录加载成功')
    },
    onError: () => message.error('加载失败，请重试'),
  })
}
