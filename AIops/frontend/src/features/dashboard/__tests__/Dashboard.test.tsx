import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'

// Mock the API modules
vi.mock('@/api/hosts', () => ({
  hostsApi: { list: vi.fn().mockResolvedValue({ data: { data: [] } }) },
}))
vi.mock('@/api/models', () => ({
  modelsApi: { list: vi.fn().mockResolvedValue({ data: { data: [] } }) },
}))
vi.mock('@/api/workflows', () => ({
  workflowsApi: { list: vi.fn().mockResolvedValue({ data: { data: [] } }) },
}))
vi.mock('@/api/deployments', () => ({
  deploymentsApi: {
    listTasks: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  it('renders 4 stat cards', () => {
    render(<Dashboard />, { wrapper })
    expect(screen.getByText('主机总数')).toBeInTheDocument()
    expect(screen.getByText('模型接入数')).toBeInTheDocument()
    expect(screen.getByText('进行中部署')).toBeInTheDocument()
    expect(screen.getByText('工作流数')).toBeInTheDocument()
  })

  it('renders recent activity section', () => {
    render(<Dashboard />, { wrapper })
    expect(screen.getByText('最近部署活动')).toBeInTheDocument()
  })
})
