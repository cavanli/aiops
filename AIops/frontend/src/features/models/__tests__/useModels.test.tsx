import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useModels, useCreateModel } from '../useModels'
import { modelsApi } from '@/api/models'
import type { Model } from '@/types/model'

vi.mock('@/api/models')

const mockModel: Model = {
  id: 1,
  name: 'GPT-4o',
  provider: 'openai',
  model_type: 'chat',
  api_endpoint: '',
  description: '',
  status: 'active',
  created_at: '2026-04-04T00:00:00Z',
  updated_at: '2026-04-04T00:00:00Z',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useModels', () => {
  beforeEach(() => {
    vi.mocked(modelsApi.list).mockResolvedValue({
      data: { data: { items: [mockModel], total: 1, page: 1, page_size: 10 }, code: 0, message: 'ok' },
    } as any)
  })

  it('fetches model list', async () => {
    const { result } = renderHook(() => useModels(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('GPT-4o')
  })
})

describe('useCreateModel', () => {
  it('exposes mutate function', () => {
    vi.mocked(modelsApi.create).mockResolvedValue({
      data: { data: mockModel, code: 0, message: 'ok' },
    } as any)
    const { result } = renderHook(() => useCreateModel(), { wrapper: makeWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })
})
