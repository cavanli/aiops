import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TaskLogDrawer from '../TaskLogDrawer'
import { deploymentsApi } from '@/api/deployments'

vi.mock('@/api/deployments')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('TaskLogDrawer', () => {
  it('renders closed drawer without fetching', () => {
    render(
      <TaskLogDrawer open={false} taskId={0} onClose={vi.fn()} />,
      { wrapper }
    )
    expect(deploymentsApi.getTask).not.toHaveBeenCalled()
  })

  it('renders log content when open', async () => {
    vi.mocked(deploymentsApi.getTask).mockResolvedValue({
      data: {
        data: {
          id: 1, logs: 'deployment log line 1\ndeployment log line 2',
          status: 'success', template_name: 'Deploy App',
          host_ids: [1], target_hosts: ['host1'],
          fail_fast: false, started_at: null, finished_at: null,
          created_at: '', template_id: 1,
        },
        code: 0, message: 'ok',
      },
    } as any)

    render(<TaskLogDrawer open={true} taskId={1} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('部署日志')).toBeInTheDocument()
  })
})
