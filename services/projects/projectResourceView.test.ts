import { describe, expect, it } from 'vitest'
import type { Project } from '~/types/project'
import { toGeneratedPlan } from './projectResourceView'

const project: Project = {
  project_id: 'project-1',
  thread_ids: ['thread-1'],
  business_name: 'Acme',
  value_proposition: 'Ahorra tiempo',
  status: 'review',
  created_at: '2026-08-07T12:00:00Z',
  updated_at: '2026-08-07T12:00:00Z',
  resources: {
    landing: { status: 'pending', payload: { preview_url: 'https://preview', composition: {} } },
    images: {
      status: 'pending',
      payload: {
        creatives: [
          { variant_index: 0, storage_url: 'https://img/0.png', headline: 'Ahorra tiempo', cta_text: 'Prueba' },
        ],
      },
    },
    campaign: {
      status: 'pending',
      payload: {
        config: { name: 'Acme', objective: 'OUTCOME_TRAFFIC', ad_sets: [] },
      },
    },
  },
}

describe('project resource view', () => {
  it('maps persisted backend resources to the playground view', () => {
    const plan = toGeneratedPlan(project)

    expect(plan?.landing).toEqual({ url: 'https://preview', title: 'Acme' })
    expect(plan?.creatives[0]).toMatchObject({ id: '0', imageUrl: 'https://img/0.png' })
  })

  it('does not fabricate a plan when resources are empty', () => {
    const emptyProject: Project = {
      ...project,
      business_name: null,
      value_proposition: null,
      status: 'in_progress',
      resources: {
        landing: { status: 'pending', payload: {} },
        campaign: { status: 'pending', payload: {} },
        images: { status: 'pending', payload: {} },
      },
    }

    expect(toGeneratedPlan(emptyProject)).toBeNull()
  })
})
