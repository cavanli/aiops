import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { skillsApi } from '@/api/skills'
import type { CreateSkillRequest, UpdateSkillRequest } from '@/types/skill'

export function useSkills(category?: string) {
  return useQuery({
    queryKey: ['skills', category],
    queryFn: () =>
      skillsApi
        .list({ page: 1, page_size: 100, category: category || undefined })
        .then((r) => r.data.data),
  })
}

export function useCreateSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSkillRequest) => skillsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] })
      message.success('技能创建成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useUpdateSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSkillRequest }) =>
      skillsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] })
      message.success('技能更新成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useDeleteSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => skillsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] })
      message.success('技能删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}
