export type ProjectStatus = 'draft' | 'generating' | 'review' | 'live' | 'validated' | 'rejected'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  createdAt: Date
  updatedAt: Date
}
