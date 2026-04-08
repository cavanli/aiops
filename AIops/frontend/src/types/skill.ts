export type SkillCategory = 'env_setup' | 'deployment' | 'testing' | 'security'
export type ScriptType = 'shell' | 'python' | 'ansible'
export type SkillSource = 'official' | 'community' | 'security_team' | 'custom'

export interface Skill {
  id: number
  name: string
  category: SkillCategory
  description: string
  script_content: string
  script_type: ScriptType
  author: string
  source?: SkillSource
  created_by: number
  created_at: string
  updated_at: string
}

export interface CreateSkillRequest {
  name: string
  category: SkillCategory
  description?: string
  script_content?: string
  script_type?: ScriptType
  author?: string
  source?: SkillSource
}

export interface UpdateSkillRequest {
  name?: string
  category?: SkillCategory
  description?: string
  script_content?: string
  script_type?: ScriptType
  author?: string
  source?: SkillSource
}
