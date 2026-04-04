export type ModelProvider = 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'custom'
export type ModelType = 'chat' | 'embedding'
export type ModelStatus = 'active' | 'inactive'

export interface Model {
  id: number
  name: string
  provider: ModelProvider
  model_type: ModelType
  model_id: string
  endpoint: string
  status: ModelStatus
  created_at: string
  updated_at: string
}

export interface CreateModelRequest {
  name: string
  provider: ModelProvider
  model_type: ModelType
  model_id: string
  endpoint?: string
  api_key: string
  status: ModelStatus
}

export interface UpdateModelRequest extends Partial<CreateModelRequest> {}

export interface TestModelResult {
  latency_ms: number
  message: string
}
