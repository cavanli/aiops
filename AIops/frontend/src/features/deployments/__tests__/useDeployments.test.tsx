import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useTemplates,
  useTasks,
  useTaskPolling,
} from '../useDeployments'
import { deploymentsApi } from '@/api/deployments'
import type { DeploymentTemplate, DeploymentTask } from '@/types/deployment'

vi.mock('@/api/deployments')

const mockTemplate: DeploymentTemplate = {
  id: 1,
  name: 'Deploy App',
  script_type: 'shell',
  description: '',
  script_content: 'echo deploy',
  params: {},
  health_check: {},
  created_by: 1,
  created_at: '2026-04-04T00:00:00Z',
  updated_at: '2026-04-04T00:00:00Z',
}

const mockTask: DeploymentTask = {
  id: 1,
  template_id: 1,
  host_ids: [1],
  strategy: 'fail_fast',
  status: 'running',
  logs: [],
  params: {},
  start_time: '2026-04-04T00:00:00Z',
  end_time: null,
  created_by: 1,
  created_at: '2026-04-04T00:00:00Z',
  updated_at: '2026-04-04T00:00:00Z',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useTemplates', () => {
  beforeEach(() => {
    vi.mocked(deploymentsApi.listTemplates).mockResolvedValue({
      data: { data: { items: [mockTemplate], total: 1, page: 1, page_size: 10 }, code: 0, message: 'ok' },
    } as any)
  })

  it('fetches template list', async () => {
    const { result } = renderHook(() => useTemplates(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('Deploy App')
  })
})

describe('useTasks', () => {
  beforeEach(() => {
    vi.mocked(deploymentsApi.listTasks).mockResolvedValue({
      data: { data: { items: [mockTask], total: 1, page: 1, page_size: 10 }, code: 0, message: 'ok' },
    } as any)
  })

  it('fetches task list', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].status).toBe('running')
  })
})

describe('useTaskPolling', () => {
  it('returns task data with refetchInterval when status is running', async () => {
    vi.mocked(deploymentsApi.getTask).mockResolvedValue({
      data: { data: mockTask, code: 0, message: 'ok' },
    } as any)
    const { result } = renderHook(() => useTaskPolling(1), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('running')
  })
})
