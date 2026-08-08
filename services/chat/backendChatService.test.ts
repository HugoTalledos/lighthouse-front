import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChatSession } from '../interfaces'
import { createBackendChatService } from './backendChatService'

class FakeStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const originalWindow = globalThis.window

afterEach(() => {
  if (originalWindow) globalThis.window = originalWindow
  else delete (globalThis as typeof globalThis & { window?: Window }).window
})

function responseFrom(chunks: string[]): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })

  return new Response(body, { status: 200 })
}

describe('backend chat service', () => {
  it('posts the message and streams the backend response', async () => {
    const fetcher = vi.fn().mockResolvedValue(responseFrom([
      'event: start\ndata: {"thread_id":"thread-2"}\n\n',
      'event: message\ndata: {"content":"Respuesta"}\n\n',
      'event: done\ndata: {"thread_id":"thread-2","project_id":"p-1"}\n\n',
    ]))
    const onThreadId = vi.fn()
    const onMessage = vi.fn()
    const service = createBackendChatService({
      baseUrl: 'http://localhost:8000/', apiKey: 'secret', fetch: fetcher,
    })

    const result = await service.sendMessage('p-1', 'Hola', { onThreadId, onMessage })

    expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/chat', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'secret' },
      body: JSON.stringify({ project_id: 'p-1', message: 'Hola', thread_id: null }),
    }))
    expect(onThreadId).toHaveBeenCalledWith('thread-2')
    expect(onMessage).toHaveBeenCalledWith('Respuesta')
    expect(result).toMatchObject({ projectId: 'p-1', role: 'agent', content: 'Respuesta' })
    expect(result.timestamp).toBeInstanceOf(Date)
  })

  it('sends the saved thread ID with a later message', async () => {
    const storage = new FakeStorage()
    globalThis.window = { localStorage: storage } as Window & typeof globalThis
    const fetcher = vi.fn().mockResolvedValue(responseFrom([
      'event: done\ndata: {"thread_id":"thread-1","project_id":"p-1"}\n\n',
    ]))
    const service = createBackendChatService({ baseUrl: 'http://localhost:8000', fetch: fetcher })
    const session = { threadId: 'thread-1', messages: [] } satisfies ChatSession

    await service.saveConversation('p-1', session)
    await service.sendMessage('p-1', 'Siguiente mensaje')

    expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/chat', expect.objectContaining({
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: 'p-1', message: 'Siguiente mensaje', thread_id: 'thread-1' }),
    }))
    await expect(service.getConversation('p-1')).resolves.toEqual(session)
  })

  it('sends an explicitly provided thread ID without requiring saved storage', async () => {
    const fetcher = vi.fn().mockResolvedValue(responseFrom([
      'event: done\ndata: {"thread_id":"explicit-thread","project_id":"p-1"}\n\n',
    ]))
    const service = createBackendChatService({ baseUrl: 'http://localhost:8000', fetch: fetcher })

    await service.sendMessage('p-1', 'Siguiente mensaje', { threadId: 'explicit-thread' })

    expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/chat', expect.objectContaining({
      body: JSON.stringify({ project_id: 'p-1', message: 'Siguiente mensaje', thread_id: 'explicit-thread' }),
    }))
  })

  it('throws when the chat request is not successful', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('unavailable', { status: 503, statusText: 'Unavailable' }))
    const service = createBackendChatService({ baseUrl: 'http://localhost:8000', fetch: fetcher })

    await expect(service.sendMessage('p-1', 'Hola')).rejects.toThrow('503')
  })

  it('throws when the backend response has no body', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    const service = createBackendChatService({ baseUrl: 'http://localhost:8000', fetch: fetcher })

    await expect(service.sendMessage('p-1', 'Hola')).rejects.toThrow('body')
  })

  it('throws the backend error event message', async () => {
    const fetcher = vi.fn().mockResolvedValue(responseFrom([
      'event: error\ndata: {"message":"El agente no está disponible"}\n\n',
    ]))
    const service = createBackendChatService({ baseUrl: 'http://localhost:8000', fetch: fetcher })

    await expect(service.sendMessage('p-1', 'Hola')).rejects.toThrow('El agente no está disponible')
  })

  it('throws when the stream ends without a done event', async () => {
    const fetcher = vi.fn().mockResolvedValue(responseFrom([
      'event: message\ndata: {"content":"Respuesta incompleta"}\n\n',
    ]))
    const service = createBackendChatService({ baseUrl: 'http://localhost:8000', fetch: fetcher })

    await expect(service.sendMessage('p-1', 'Hola')).rejects.toThrow('done')
  })

  it('ignores tool events while streaming messages', async () => {
    const fetcher = vi.fn().mockResolvedValue(responseFrom([
      'event: tool_call\ndata: {"tool":"search"}\n\n',
      'event: tool_result\ndata: {"result":"found"}\n\n',
      'event: done\ndata: {"thread_id":"thread-1","project_id":"p-1"}\n\n',
    ]))
    const onMessage = vi.fn()
    const service = createBackendChatService({ baseUrl: 'http://localhost:8000', fetch: fetcher })

    const result = await service.sendMessage('p-1', 'Hola', { onMessage })

    expect(onMessage).not.toHaveBeenCalled()
    expect(result.content).toBe('')
  })
})
