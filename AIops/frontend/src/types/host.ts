export type HostStatus = 'online' | 'offline' | 'unknown'
export type HostEnv = 'production' | 'staging' | 'dev' | ''

export interface Host {
  id: number
  name: string
  ip: string
  port: number
  ssh_user: string
  status: HostStatus
  env: HostEnv
  tags: string[]
  description: string
  created_at: string
  updated_at: string
}

export interface CreateHostRequest {
  name: string
  ip: string
  port: number
  ssh_user: string
  ssh_key: string
  env?: HostEnv
  tags?: string[]
  description?: string
}

export interface UpdateHostRequest {
  name?: string
  ip?: string
  port?: number
  ssh_user?: string
  ssh_key?: string
  env?: HostEnv
  tags?: string[]
  description?: string
}

export interface TestConnectionResult {
  latency_ms?: number
  message: string
}
