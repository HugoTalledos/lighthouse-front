import type { IProjectService, IChatService } from './interfaces'
import { createBackendChatService } from './chat/backendChatService'
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
