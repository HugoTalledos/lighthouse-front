import { ref } from 'vue'
import type { ChatMessage } from '../types/chat'
import { getChatService } from '../services'
import type { ChatSession, IChatService } from '../services/interfaces'

export function useChat(projectId: string, service: IChatService = getChatService()) {
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const isTyping = ref(false)
  const error = ref<string | null>(null)
  const threadId = ref<string | null>(null)
  let pendingSave = Promise.resolve()

  function session(): ChatSession {
    return { threadId: threadId.value, messages: [...messages.value] }
  }

  function saveSession() {
    const savedSession = session()
    const nextSave = pendingSave.then(() => service.saveConversation(projectId, savedSession))
    pendingSave = nextSave.catch(() => undefined)
    return nextSave
  }

  function setError(e: unknown, fallback: string) {
    error.value = e instanceof Error ? e.message : fallback
  }

  async function fetchMessages() {
    loading.value = true
    error.value = null
    try {
      const savedSession = await service.getConversation(projectId)
      messages.value = savedSession.messages
      threadId.value = savedSession.threadId
    } catch (e) {
      setError(e, 'Error desconocido')
    } finally {
      loading.value = false
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isTyping.value) return

    error.value = null
    const optimisticUser: ChatMessage = {
      id: `opt-${Date.now()}`,
      projectId,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }
    messages.value.push(optimisticUser)
    isTyping.value = true
    let streamedAgent: ChatMessage | undefined

    try {
      await saveSession()
      const agentMsg = await service.sendMessage(projectId, content.trim(), {
        threadId: threadId.value,
        onThreadId(value) {
          threadId.value = value
          void saveSession().catch(e => setError(e, 'Error al guardar la conversación'))
        },
        onMessage(chunk) {
          if (!streamedAgent) {
            streamedAgent = {
              id: `stream-${Date.now()}`,
              projectId,
              role: 'agent',
              content: '',
              timestamp: new Date(),
            }
            messages.value.push(streamedAgent)
          }
          streamedAgent.content += chunk
          void saveSession().catch(e => setError(e, 'Error al guardar la conversación'))
        },
      })
      if (!streamedAgent) messages.value.push(agentMsg)
      await saveSession()
    } catch (e) {
      setError(e, 'Error al enviar mensaje')
    } finally {
      isTyping.value = false
    }
  }

  return { messages, loading, isTyping, error, fetchMessages, sendMessage }
}
