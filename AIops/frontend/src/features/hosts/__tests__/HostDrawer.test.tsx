import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HostDrawer from '../HostDrawer'

vi.mock('@/api/hosts', () => ({
  hostsApi: {
    create: vi.fn().mockResolvedValue({ data: { data: {}, code: 0, message: 'ok' } }),
    update: vi.fn().mockResolvedValue({ data: { data: {}, code: 0, message: 'ok' } }),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockHost = {
  id: 1,
  name: 'h1',
  ip: '1.1.1.1',
  port: 22,
  ssh_user: 'admin',
  status: 'online' as const,
  env: 'production' as const,
  tags: [],
  description: '',
  created_at: '',
  updated_at: '',
}

describe('HostDrawer', () => {
  it('renders add title when editingHost is null', () => {
    render(
      <HostDrawer open={true} editingHost={null} onClose={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByText('添加主机')).toBeInTheDocument()
  })

  it('renders edit title when editingHost is provided', () => {
    render(
      <HostDrawer open={true} editingHost={mockHost} onClose={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByText('编辑主机')).toBeInTheDocument()
  })
})
