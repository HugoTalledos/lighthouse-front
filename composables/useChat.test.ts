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
  it('does not send or persist until the saved conversation has been restored', async () => {
    const savedSession = { threadId: 'saved-thread', messages: [message('old-1', 'agent', 'Hola')] }
    let restoreConversation!: (session: ChatSession) => void
    const service: IChatService = {
      getConversation: vi.fn(() => new Promise(resolve => { restoreConversation = resolve })),
      saveConversation: vi.fn().mockResolvedValue(undefined),
      sendMessage: vi.fn().mockResolvedValue(message('agent-1', 'agent', 'Listo')),
    }
    const chat = useChat('p-1', service)

    await chat.sendMessage('Antes de montar')

    expect(service.getConversation).not.toHaveBeenCalled()
    expect(service.sendMessage).not.toHaveBeenCalled()
    expect(service.saveConversation).not.toHaveBeenCalled()

    const restoring = chat.fetchMessages()
    await chat.sendMessage('Mensaje temprano')

    expect(service.sendMessage).not.toHaveBeenCalled()
    expect(service.saveConversation).not.toHaveBeenCalled()
    expect(chat.messages.value).toEqual([])

    restoreConversation(savedSession)
    await restoring
    await chat.sendMessage('Continúa')

    expect(service.sendMessage).toHaveBeenCalledWith('p-1', 'Continúa', expect.objectContaining({
      threadId: 'saved-thread',
    }))
    expect(service.saveConversation).toHaveBeenCalledWith('p-1', expect.objectContaining({
      threadId: 'saved-thread',
      messages: expect.arrayContaining([expect.objectContaining({ role: 'user', content: 'Continúa' })]),
    }))
  })

  it('exposes the current tool activity while streaming and clears it when the turn ends', async () => {
    let handlersReady!: (handlers: ChatStreamHandlers) => void
    const handlersPromise = new Promise<ChatStreamHandlers>(resolve => { handlersReady = resolve })
    let finish!: () => void
    const service = fakeChatService({ threadId: 'saved-thread', messages: [] }, (_projectId, _content, options) => {
      handlersReady(options!)
      return new Promise(resolve => { finish = () => resolve(message('agent-1', 'agent', 'Listo')) })
    })
    const chat = useChat('p-1', service)

    await chat.fetchMessages()
    const sending = chat.sendMessage('Genera la landing')
    const handlers = await handlersPromise

    expect(chat.activity.value).toBeNull()
    handlers.onToolActivity!({ name: 'landing_builder_tool', phase: 'running' })
    expect(chat.activity.value).toEqual({ name: 'landing_builder_tool', phase: 'running' })
    handlers.onToolActivity!({ name: 'landing_builder_tool', phase: 'done', status: 'success' })
    expect(chat.activity.value).toEqual({ name: 'landing_builder_tool', phase: 'done', status: 'success' })

    finish()
    await sending
    expect(chat.activity.value).toBeNull()
  })

  it('clears the tool activity when the turn fails', async () => {
    const service = fakeChatService({ threadId: 'saved-thread', messages: [] }, async (_projectId, _content, options) => {
      options?.onToolActivity?.({ name: 'landing_builder_tool', phase: 'running' })
      throw new Error('boom')
    })
    const chat = useChat('p-1', service)

    await chat.fetchMessages()
    await chat.sendMessage('Genera la landing')

    expect(chat.error.value).toBe('boom')
    expect(chat.activity.value).toBeNull()
  })

  it('does not add an empty agent message for a tool-only response', async () => {
    const service = fakeChatService({ threadId: 'saved-thread', messages: [] }, async () => {
      return message('agent-1', 'agent', '')
    })
    const chat = useChat('p-1', service)

    await chat.fetchMessages()
    await chat.sendMessage('Busca información')

    expect(chat.messages.value).toMatchObject([
      { role: 'user', content: 'Busca información' },
    ])
  })

  it('uses the project thread when no saved thread exists', async () => {
    const service = fakeChatService({ threadId: null, messages: [] }, async () => {
      return message('agent-1', 'agent', 'Listo')
    })
    const chat = useChat('p-1', service)

    await chat.fetchMessages('thread-1')
    await chat.sendMessage('Hola')

    expect(service.sendMessage).toHaveBeenCalledWith('p-1', 'Hola', expect.objectContaining({
      threadId: 'thread-1',
    }))
  })

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
