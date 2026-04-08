export type AgentStatus = 'active' | 'inactive'

export interface Agent {
  id: number
  name: string
  role: string
  status: AgentStatus
  model_name: string
  focus: string
  task_count: number
  created_by: number
  created_at: string
  updated_at: string
}

export interface CreateAgentRequest {
  name: string
  role?: string
  status?: AgentStatus
  model_name?: string
  focus?: string
}

export interface UpdateAgentRequest {
  name?: string
  role?: string
  status?: AgentStatus
  model_name?: string
  focus?: string
}
