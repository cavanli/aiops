import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWorkflows, useWorkflow } from '../useWorkflows'
import { workflowsApi } from '@/api/workflows'
import type { Workflow } from '@/types/workflow'

vi.mock('@/api/workflows')

const mockWorkflow: Workflow = {
  id: 1,
  name: 'Deploy Workflow',
  description: '',
  status: 'draft',
  nodes: [],
  edges: [],
  node_count: 0,
  last_executed_at: null,
  created_at: '2026-04-04T00:00:00Z',
  updated_at: '2026-04-04T00:00:00Z',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.mocked(workflowsApi.list).mockResolvedValue({
      data: { data: [mockWorkflow], code: 0, message: 'ok' },
    } as any)
  })

  it('fetches workflow list', async () => {
    const { result } = renderHook(() => useWorkflows(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('Deploy Workflow')
  })
})

describe('useWorkflow', () => {
  beforeEach(() => {
    vi.mocked(workflowsApi.get).mockResolvedValue({
      data: { data: mockWorkflow, code: 0, message: 'ok' },
    } as any)
  })

  it('fetches single workflow by id', async () => {
    const { result } = renderHook(() => useWorkflow(1), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
  })
})
