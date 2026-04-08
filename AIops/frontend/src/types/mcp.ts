export type McpStatus = 'running' | 'stopped' | 'error'
export type McpTransport = 'stdio' | 'sse' | 'http'

export interface McpServer {
  id: number
  name: string
  command: string
  status: McpStatus
  transport: McpTransport
  tools_count: number
  uptime_seconds?: number
  created_at: string
  updated_at: string
}

export interface CreateMcpServerRequest {
  name: string
  command: string
  transport?: McpTransport
  env?: Record<string, string>
}

export interface UpdateMcpServerRequest {
  name?: string
  command?: string
  transport?: McpTransport
  env?: Record<string, string>
}
