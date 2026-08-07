import type { Project } from '~/types/project'
import type { ChatMessage } from '~/types/chat'
import type { GeneratedPlan } from '~/types/playground'

export interface IProjectService {
  listProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | undefined>
  createProject(name: string, description: string): Promise<Project>
  updateProjectStatus(id: string, status: Project['status']): Promise<Project>
}

export interface ChatSession {
  threadId: string | null
  messages: ChatMessage[]
}

export interface ChatStreamHandlers {
  threadId?: string | null
  onThreadId?: (threadId: string) => void
  onMessage?: (content: string) => void
}

export interface IChatService {
  getConversation(projectId: string): Promise<ChatSession>
  saveConversation(projectId: string, session: ChatSession): Promise<void>
  sendMessage(projectId: string, content: string, options?: ChatStreamHandlers): Promise<ChatMessage>
}

export interface IPlaygroundService {
  getPlan(projectId: string): Promise<GeneratedPlan>
  approvePlan(projectId: string): Promise<void>
}
