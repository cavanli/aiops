export type TemplateType = 'shell' | 'helm' | 'docker-compose'
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'

export interface DeploymentTemplate {
  id: number
  name: string
  type: TemplateType
  description: string
  script_content: string
  created_at: string
  updated_at: string
}

export interface CreateTemplateRequest {
  name: string
  type: TemplateType
  description?: string
  script_content: string
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

export interface DeploymentTask {
  id: number
  template_id: number
  template_name: string
  host_ids: number[]
  target_hosts: string[]
  status: TaskStatus
  fail_fast: boolean
  logs: string
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface CreateTaskRequest {
  template_id: number
  host_ids: number[]
  fail_fast: boolean
}

export interface DashboardStats {
  host_count: number
  model_count: number
  running_deployment_count: number
  workflow_count: number
}
