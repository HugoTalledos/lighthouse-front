export type ChatRole = 'user' | 'agent' | 'system'

export interface ChatMessage {
  id: string
  projectId: string
  role: ChatRole
  content: string
  timestamp: Date
}

export interface ChatTurn {
  userMessage: ChatMessage
  agentMessage?: ChatMessage
}

export interface ToolActivity {
  name: string
  phase: 'running' | 'done'
  status?: string
}
