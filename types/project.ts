export type ProjectStatus = 'in_progress' | 'review' | 'approved'

export type ResourceApprovalStatus = 'pending' | 'approved'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type ResourcePayload = Record<string, JsonValue>

export interface ResourceState {
  status: ResourceApprovalStatus
  payload: ResourcePayload
}

export interface ProjectResources {
  landing: ResourceState
  campaign: ResourceState
  images: ResourceState
}

export interface Project {
  project_id: string
  thread_ids: string[]
  business_name: string | null
  value_proposition: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
  resources: ProjectResources
}
