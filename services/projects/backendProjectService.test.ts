import { describe, expect, it, vi } from 'vitest'
import { createBackendProjectService } from './backendProjectService'

const projectJson = {
  project_id: 'project-1',
  thread_ids: ['thread-1'],
  business_name: null,
  value_proposition: null,
  status: 'in_progress',
  created_at: '2026-08-07T12:00:00Z',
  updated_at: '2026-08-07T12:00:00Z',
  resources: {
    landing: { status: 'pending', payload: {} },
    campaign: { status: 'pending', payload: {} },
    images: { status: 'pending', payload: {} },
  },
}

function responseFetcher(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }))
}

describe('backend project service', () => {
  it('creates a project with only the thread ID', async () => {
    const fetcher = responseFetcher(projectJson, 201)
    const service = createBackendProjectService({
      baseUrl: 'http://localhost:8000/',
      apiKey: 'secret',
      fetch: fetcher,
    })

    await service.createProject('thread-1')

    expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/projects', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'secret' },
      body: JSON.stringify({ thread_id: 'thread-1' }),
    }))
  })

  it('uses backend project fields without inventing UI aliases', async () => {
    const service = createBackendProjectService({ fetch: responseFetcher(projectJson) })

    await expect(service.getProject('project-1')).resolves.toMatchObject({
      project_id: 'project-1',
      business_name: null,
      value_proposition: null,
      status: 'in_progress',
      resources: expect.any(Object),
    })
  })

  it('lists projects from the backend', async () => {
    const service = createBackendProjectService({ fetch: responseFetcher([projectJson]) })

    await expect(service.listProjects()).resolves.toEqual([projectJson])
  })

  it('throws an error containing the HTTP status for non-success responses', async () => {
    const service = createBackendProjectService({
      fetch: responseFetcher({ detail: 'unavailable' }, 503),
    })

    await expect(service.getProject('project-1')).rejects.toThrow('503')
  })
})
