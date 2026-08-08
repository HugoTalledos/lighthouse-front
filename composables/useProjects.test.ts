import { describe, expect, it, vi } from 'vitest'
import type { IProjectService } from '~/services/interfaces'
import type { Project } from '~/types/project'
import { useProjects } from './useProjects'

function projectFixture(overrides: Partial<Project> = {}): Project {
  return {
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
    ...overrides,
  }
}

describe('useProjects', () => {
  it('creates a project using a thread ID and stores the backend project', async () => {
    const project = projectFixture()
    const service = {
      listProjects: vi.fn(),
      getProject: vi.fn(),
      createProject: vi.fn().mockResolvedValue(project),
    } satisfies IProjectService
    const projects = useProjects(service)

    await expect(projects.createProject('thread-1')).resolves.toEqual(project)

    expect(service.createProject).toHaveBeenCalledWith('thread-1')
    expect(projects.projects.value).toEqual([project])
  })
})
