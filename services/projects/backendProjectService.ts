import type { IProjectService } from '../interfaces'
import type { Project } from '~/types/project'

export interface BackendProjectServiceConfig {
  baseUrl?: string
  apiKey?: string
  fetch?: typeof globalThis.fetch
}

export function createBackendProjectService(config: BackendProjectServiceConfig): IProjectService {
  const baseUrl = (config.baseUrl ?? 'http://localhost:8000').replace(/\/+$/, '')
  const fetcher = config.fetch ?? globalThis.fetch

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
    }
    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers: { ...headers, ...init?.headers },
    })

    if (!response.ok) {
      throw new Error(`Project request failed: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }

  return {
    listProjects() {
      return request<Project[]>('/projects')
    },

    getProject(projectId: string) {
      return request<Project>(`/projects/${encodeURIComponent(projectId)}`)
    },

    createProject(threadId: string) {
      return request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({ thread_id: threadId }),
      })
    },
  }
}
