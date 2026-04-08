import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHosts, useCreateHost } from '../useHosts'
import { hostsApi } from '@/api/hosts'
import type { Host } from '@/types/host'

vi.mock('@/api/hosts')

const mockHost: Host = {
  id: 1,
  name: 'test-host',
  ip: '192.168.1.1',
  port: 22,
  ssh_user: 'admin',
  status: 'online',
  env: 'production',
  tags: [],
  description: '',
  created_at: '2026-04-04T00:00:00Z',
  updated_at: '2026-04-04T00:00:00Z',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useHosts', () => {
  beforeEach(() => {
    vi.mocked(hostsApi.list).mockResolvedValue({
      data: { data: { items: [mockHost], total: 1, page: 1, page_size: 10 }, code: 0, message: 'ok' },
    } as any)
  })

  it('fetches host list', async () => {
    const { result } = renderHook(() => useHosts(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('test-host')
  })
})

describe('useCreateHost', () => {
  it('exposes mutate function', () => {
    vi.mocked(hostsApi.create).mockResolvedValue({ data: { data: mockHost, code: 0, message: 'ok' } } as any)
    const { result } = renderHook(() => useCreateHost(), { wrapper: makeWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })
})
