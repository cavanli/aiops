export type AuthMethod = 'password' | 'key'
export type HostStatus = 'online' | 'offline' | 'unknown'

export interface Host {
  id: number
  name: string
  ip: string
  port: number
  auth_method: AuthMethod
  username: string
  description: string
  status: HostStatus
  created_at: string
  updated_at: string
}

export interface CreateHostRequest {
  name: string
  ip: string
  port: number
  auth_method: AuthMethod
  username: string
  password?: string
  private_key?: string
  description?: string
}

export interface UpdateHostRequest extends Partial<CreateHostRequest> {}

export interface TestConnectionResult {
  latency_ms: number
  message: string
}
