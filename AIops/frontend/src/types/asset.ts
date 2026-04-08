export type AssetType = 'file' | 'directory'
export type AssetSource = 'upload' | 'local'

export interface Asset {
  id: number
  name: string
  reference_id: string
  type: AssetType
  source: AssetSource
  path: string
  size?: number
  created_at: string
  updated_at: string
}

export interface CreateAssetRequest {
  name: string
  type: AssetType
  source: AssetSource
  path: string
  size?: number
}

export interface UpdateAssetRequest {
  name?: string
  path?: string
}
