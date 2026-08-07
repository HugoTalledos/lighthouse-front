import { afterEach, describe, expect, it } from 'vitest'
import type { ChatSession } from '../interfaces'
import { loadChatSession, saveChatSession } from './chatStorage'

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

describe('chat storage', () => {
  it('round-trips a chat session and restores message dates', () => {
    const storage = new FakeStorage()
    globalThis.window = { localStorage: storage } as Window & typeof globalThis
    const session = {
      threadId: 'thread-1',
      messages: [{
        id: 'm-1', projectId: 'p-1', role: 'agent', content: 'Hola',
        timestamp: new Date('2026-08-07T12:00:00.000Z'),
      }],
    } satisfies ChatSession

    saveChatSession('p-1', session)

    expect(loadChatSession('p-1')).toEqual(session)
    expect(loadChatSession('p-1').messages[0]?.timestamp).toBeInstanceOf(Date)
  })

  it('returns an empty session when window is unavailable', () => {
    delete (globalThis as typeof globalThis & { window?: Window }).window

    expect(loadChatSession('p-1')).toEqual({ threadId: null, messages: [] })
    expect(() => saveChatSession('p-1', { threadId: null, messages: [] })).not.toThrow()
  })

  it('returns an empty session for malformed stored data', () => {
    const storage = new FakeStorage()
    globalThis.window = { localStorage: storage } as Window & typeof globalThis
    storage.setItem('lighthouse:chat:p-1', '{"threadId":42,"messages":[]}')

    expect(loadChatSession('p-1')).toEqual({ threadId: null, messages: [] })
  })
})
