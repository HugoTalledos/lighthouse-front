import type { Project } from '~/types/project'
import type { ChatMessage } from '~/types/chat'
import type { GeneratedPlan } from '~/types/playground'

export interface IProjectService {
  listProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | undefined>
  createProject(name: string, description: string): Promise<Project>
  updateProjectStatus(id: string, status: Project['status']): Promise<Project>
}

export interface IChatService {
  getMessages(projectId: string): Promise<ChatMessage[]>
  sendMessage(projectId: string, content: string): Promise<ChatMessage>
}

export interface IPlaygroundService {
  getPlan(projectId: string): Promise<GeneratedPlan>
  approvePlan(projectId: string): Promise<void>
}
