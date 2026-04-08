import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ClusterEnv = 'prod' | 'staging' | 'dev'

interface ClusterState {
  env: ClusterEnv
  setEnv: (env: ClusterEnv) => void
}

export const CLUSTER_LABELS: Record<ClusterEnv, string> = {
  prod: '生产集群',
  staging: '预发集群',
  dev: '开发集群',
}

export const useClusterStore = create<ClusterState>()(
  persist(
    (set) => ({
      env: 'prod',
      setEnv: (env) => set({ env }),
    }),
    { name: 'aiops-cluster' }
  )
)
