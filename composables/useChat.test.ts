import { describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '~/types/chat'
import type { ChatSession, ChatStreamHandlers, IChatService } from '~/services/interfaces'
import { useChat } from './useChat'

function message(id: string, role: ChatMessage['role'], content: string): ChatMessage {
  return { id, projectId: 'p-1', role, content, timestamp: new Date('2026-08-07T00:00:00.000Z') }
}

function fakeChatService(session: ChatSession, send: IChatService['sendMessage']): IChatService {
  return {
    getConversation: vi.fn().mockResolvedValue(session),
    saveConversation: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn(send),
  }
}

describe('useChat', () => {
  it('continues a saved thread and updates the agent bubble while streaming', async () => {
    const savedSession = { threadId: 'saved-thread', messages: [message('old-1', 'agent', 'Hola')] }
    let finishStream!: () => void
    const streamFinished = new Promise<void>(resolve => { finishStream = resolve })
    const service = fakeChatService(savedSession, async (_projectId, _content, handlers?: ChatStreamHandlers) => {
      handlers?.onThreadId?.('streamed-thread')
      handlers?.onMessage?.('Respuesta ')
      await streamFinished
      handlers?.onMessage?.('en streaming')
      return message('agent-1', 'agent', 'Respuesta en streaming')
    })
    const chat = useChat('p-1', service)

    await chat.fetchMessages()
    const sending = chat.sendMessage('Sigue')
    await vi.waitFor(() => expect(service.sendMessage).toHaveBeenCalledTimes(1))

    expect(service.sendMessage).toHaveBeenCalledWith('p-1', 'Sigue', expect.objectContaining({
      threadId: 'saved-thread',
      onThreadId: expect.any(Function), onMessage: expect.any(Function),
    }))
    expect(chat.messages.value).toMatchObject([
      { id: 'old-1', content: 'Hola' },
      { role: 'user', content: 'Sigue' },
      { role: 'agent', content: 'Respuesta ' },
    ])
    expect(service.saveConversation).toHaveBeenCalledWith('p-1', expect.objectContaining({
      threadId: 'saved-thread',
      messages: expect.arrayContaining([expect.objectContaining({ role: 'user', content: 'Sigue' })]),
    }))
    finishStream()
    await sending
    expect(chat.messages.value.at(-1)?.content).toBe('Respuesta en streaming')
    expect(service.saveConversation).toHaveBeenLastCalledWith('p-1', {
      threadId: 'streamed-thread',
      messages: chat.messages.value,
    })
    expect(chat.isTyping.value).toBe(false)
  })

  it('keeps the user message and partial response when streaming fails', async () => {
    const service = fakeChatService({ threadId: 'saved-thread', messages: [] }, async (_projectId, _content, handlers?: ChatStreamHandlers) => {
      handlers?.onMessage?.('Respuesta parcial')
      throw new Error('El agente no está disponible')
    })
    const chat = useChat('p-1', service)

    await chat.fetchMessages()
    await chat.sendMessage('Sigue')

    expect(chat.messages.value).toMatchObject([
      { role: 'user', content: 'Sigue' },
      { role: 'agent', content: 'Respuesta parcial' },
    ])
    expect(chat.error.value).toBe('El agente no está disponible')
    expect(chat.isTyping.value).toBe(false)
    expect(service.saveConversation).toHaveBeenLastCalledWith('p-1', {
      threadId: 'saved-thread',
      messages: chat.messages.value,
    })
  })
})
