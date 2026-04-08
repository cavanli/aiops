export type ScriptType = 'shell' | 'python' | 'helm' | 'docker-compose'
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
export type DeployStrategy = 'fail_fast' | 'continue_on_failure'

export interface DeploymentTemplate {
  id: number
  name: string
  description: string
  script_type: ScriptType
  script_content: string
  params: Record<string, any>
  health_check: Record<string, any>
  created_by: number
  created_at: string
  updated_at: string
}

export interface CreateTemplateRequest {
  name: string
  script_type: ScriptType
  description?: string
  script_content: string
  params?: Record<string, any>
  health_check?: Record<string, any>
}

export interface UpdateTemplateRequest {
  name?: string
  script_type?: ScriptType
  description?: string
  script_content?: string
  params?: Record<string, any>
  health_check?: Record<string, any>
}

export interface DeploymentTask {
  id: number
  template_id: number
  host_ids: number[]
  params: Record<string, any>
  strategy: DeployStrategy
  status: TaskStatus
  logs: any[]
  start_time: string | null
  end_time: string | null
  created_by: number
  created_at: string
  updated_at: string
}

export interface CreateTaskRequest {
  template_id: number
  host_ids: number[]
  params?: Record<string, any>
  strategy?: DeployStrategy
}

export interface DashboardStats {
  host_count: number
  model_count: number
  running_deployment_count: number
  workflow_count: number
}
