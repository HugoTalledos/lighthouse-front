import type { ChatMessage } from '~/types/chat'
import type { ChatSession, ChatStreamHandlers, IChatService } from '../interfaces'
import { loadChatSession, saveChatSession } from './chatStorage'
import { readSseEvents } from './sse'

export interface BackendChatServiceConfig {
  baseUrl: string
  apiKey?: string
  fetch?: typeof globalThis.fetch
}

export function createBackendChatService(config: BackendChatServiceConfig): IChatService {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')
  const fetcher = config.fetch ?? globalThis.fetch

  return {
    async getConversation(projectId: string): Promise<ChatSession> {
      return loadChatSession(projectId)
    },

    async saveConversation(projectId: string, session: ChatSession): Promise<void> {
      saveChatSession(projectId, session)
    },

    async sendMessage(projectId: string, content: string, options?: ChatStreamHandlers): Promise<ChatMessage> {
      const session = loadChatSession(projectId)
      const threadId = options && 'threadId' in options ? options.threadId : session.threadId
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (config.apiKey) headers['x-api-key'] = config.apiKey

      const response = await fetcher(`${baseUrl}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ project_id: projectId, message: content, thread_id: threadId }),
      })

      if (!response.ok) throw new Error(`Chat request failed: ${response.status} ${response.statusText}`)
      if (!response.body) throw new Error('Chat response has no body')

      let complete = false
      let responseContent = ''

      for await (const event of readSseEvents(response.body)) {
        if (event.event === 'start') {
          const threadId = event.data.thread_id
          if (typeof threadId === 'string') options?.onThreadId?.(threadId)
        }

        if (event.event === 'message') {
          const message = event.data.content
          if (typeof message === 'string') {
            responseContent += message
            options?.onMessage?.(message)
          }
        }

        if (event.event === 'tool_call') {
          const name = event.data.name
          if (typeof name === 'string') options?.onToolActivity?.({ name, phase: 'running' })
        }

        if (event.event === 'tool_result') {
          const name = event.data.name
          const status = event.data.status
          if (typeof name === 'string') {
            options?.onToolActivity?.({ name, phase: 'done', status: typeof status === 'string' ? status : undefined })
          }
        }

        if (event.event === 'error') {
          const message = event.data.message
          throw new Error(typeof message === 'string' ? message : 'Backend chat error')
        }

        if (event.event === 'done') {
          const threadId = event.data.thread_id
          if (typeof threadId === 'string') options?.onThreadId?.(threadId)
          complete = true
        }
      }

      if (!complete) throw new Error('Chat stream ended without a done event')

      return {
        id: crypto.randomUUID(),
        projectId,
        role: 'agent',
        content: responseContent,
        timestamp: new Date(),
      }
    },
  }
}
