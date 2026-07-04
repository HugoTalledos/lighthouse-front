import { ref } from 'vue'
import type { ChatMessage } from '~/types/chat'
import { getChatService } from '~/services'

export function useChat(projectId: string) {
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const isTyping = ref(false)
  const error = ref<string | null>(null)
  const service = getChatService()

  async function fetchMessages() {
    loading.value = true
    error.value = null
    try {
      messages.value = await service.getMessages(projectId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconocido'
    } finally {
      loading.value = false
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isTyping.value) return

    const optimisticUser: ChatMessage = {
      id: `opt-${Date.now()}`,
      projectId,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }
    messages.value.push(optimisticUser)
    isTyping.value = true

    try {
      const agentMsg = await service.sendMessage(projectId, content.trim())
      const userIdx = messages.value.findIndex(m => m.id === optimisticUser.id)
      if (userIdx !== -1) messages.value[userIdx] = { ...optimisticUser }
      messages.value.push(agentMsg)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al enviar mensaje'
      messages.value = messages.value.filter(m => m.id !== optimisticUser.id)
    } finally {
      isTyping.value = false
    }
  }

  return { messages, loading, isTyping, error, fetchMessages, sendMessage }
}
