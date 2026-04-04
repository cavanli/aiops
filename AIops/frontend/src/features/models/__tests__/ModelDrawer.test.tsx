import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ModelDrawer from '../ModelDrawer'

vi.mock('@/api/models', () => ({
  modelsApi: {
    create: vi.fn().mockResolvedValue({ data: { data: {}, code: 0, message: 'ok' } }),
    update: vi.fn().mockResolvedValue({ data: { data: {}, code: 0, message: 'ok' } }),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('ModelDrawer', () => {
  it('renders add title when editingModel is null', () => {
    render(<ModelDrawer open={true} editingModel={null} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('添加模型')).toBeInTheDocument()
  })

  it('renders edit title when editingModel provided', () => {
    const model = {
      id: 1, name: 'GPT-4o', provider: 'openai' as const,
      model_type: 'chat' as const, model_id: 'gpt-4o',
      endpoint: '', status: 'active' as const,
      created_at: '', updated_at: '',
    }
    render(<ModelDrawer open={true} editingModel={model} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('编辑模型')).toBeInTheDocument()
  })

  it('shows masked API Key when editing', () => {
    const model = {
      id: 1, name: 'GPT-4o', provider: 'openai' as const,
      model_type: 'chat' as const, model_id: 'gpt-4o',
      endpoint: '', status: 'active' as const,
      created_at: '', updated_at: '',
    }
    render(<ModelDrawer open={true} editingModel={model} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('重新输入')).toBeInTheDocument()
  })
})
