import type { IProjectService, IChatService, IPlaygroundService } from './interfaces'
import { createBackendChatService } from './chat/backendChatService'
import { mockPlaygroundService } from './mock/mockPlaygroundService'
import { createBackendProjectService } from './projects/backendProjectService'

export function getProjectService(): IProjectService {
  const config = useRuntimeConfig()
  return createBackendProjectService({
    baseUrl: config.public.apiBaseUrl,
    apiKey: config.public.apiKey,
  })
}

export function getChatService(): IChatService {
  const config = useRuntimeConfig()
  return createBackendChatService({
    baseUrl: config.public.apiBaseUrl,
    apiKey: config.public.apiKey,
  })
}

export function getPlaygroundService(): IPlaygroundService {
  if (useMocks) return mockPlaygroundService
  // TODO: reemplazar por implementación real
  throw new Error('Real playground service not implemented')
}
