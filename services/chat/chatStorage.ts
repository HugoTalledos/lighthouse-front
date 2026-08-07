import type { ChatSession } from '../interfaces'

const storageKey = (projectId: string) => `lighthouse:chat:${projectId}`

export function loadChatSession(projectId: string): ChatSession {
  const stored = getStorage()?.getItem(storageKey(projectId))
  if (!stored) return emptySession()

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!isChatSession(parsed)) return emptySession()

    return {
      threadId: parsed.threadId,
      messages: parsed.messages.map(message => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })),
    }
  } catch {
    return emptySession()
  }
}

export function saveChatSession(projectId: string, session: ChatSession): void {
  try {
    getStorage()?.setItem(storageKey(projectId), JSON.stringify(session))
  } catch {
    // Storage can be unavailable in SSR, private browsing, or restricted contexts.
  }
}

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function emptySession(): ChatSession {
  return { threadId: null, messages: [] }
}

function isChatSession(value: unknown): value is ChatSession {
  if (typeof value !== 'object' || value === null) return false
  const session = value as Partial<ChatSession>
  if (typeof session.threadId !== 'string' && session.threadId !== null) return false
  if (!Array.isArray(session.messages)) return false

  return session.messages.every(message => {
    if (typeof message !== 'object' || message === null) return false
    const candidate = message as Partial<ChatMessageJson>
    return typeof candidate.id === 'string'
      && typeof candidate.projectId === 'string'
      && typeof candidate.role === 'string'
      && typeof candidate.content === 'string'
      && typeof candidate.timestamp === 'string'
      && !Number.isNaN(new Date(candidate.timestamp).getTime())
  })
}

interface ChatMessageJson {
  id: string
  projectId: string
  role: string
  content: string
  timestamp: string
}
