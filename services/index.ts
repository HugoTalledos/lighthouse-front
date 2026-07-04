import type { IProjectService, IChatService, IPlaygroundService } from './interfaces'
import { mockProjectService } from './mock/mockProjectService'
import { mockChatService } from './mock/mockChatService'
import { mockPlaygroundService } from './mock/mockPlaygroundService'

const useMocks = true // TODO: reemplazar por implementación real — leer de useRuntimeConfig().public.useMocks

export function getProjectService(): IProjectService {
  if (useMocks) return mockProjectService
  // TODO: reemplazar por implementación real
  throw new Error('Real project service not implemented')
}

export function getChatService(): IChatService {
  if (useMocks) return mockChatService
  // TODO: reemplazar por implementación real
  throw new Error('Real chat service not implemented')
}

export function getPlaygroundService(): IPlaygroundService {
  if (useMocks) return mockPlaygroundService
  // TODO: reemplazar por implementación real
  throw new Error('Real playground service not implemented')
}
