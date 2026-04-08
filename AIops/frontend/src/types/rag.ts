export type DataSourceType = 'confluence' | 'github_wiki' | 'local_pdf' | 'database'
export type DataSourceStatus = 'connected' | 'disconnected' | 'syncing'

export interface DataSource {
  id: number
  name: string
  type: DataSourceType
  location: string
  status: DataSourceStatus
  last_sync?: string
  created_at: string
  updated_at: string
}

export interface CreateDataSourceRequest {
  name: string
  type: DataSourceType
  location: string
  config?: Record<string, any>
}

export interface UpdateDataSourceRequest {
  name?: string
  location?: string
  config?: Record<string, any>
}

export interface VectorSearchRequest {
  query: string
  top_k?: number
  source_ids?: number[]
}

export interface VectorSearchResult {
  content: string
  source: string
  score: number
  metadata?: Record<string, any>
}
