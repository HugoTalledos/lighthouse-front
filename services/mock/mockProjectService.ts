import type { IProjectService } from '../interfaces'
import type { Project, ProjectStatus } from '~/types/project'

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'NutriBox',
    description: 'Suscripción semanal de ingredientes para dietas restrictivas (vegana, sin gluten, keto).',
    status: 'validated',
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-06-20'),
  },
  {
    id: 'p2',
    name: 'MentorMatch',
    description: 'Plataforma que conecta emprendedores primerizos con mentores sectoriales disponibles por horas.',
    status: 'live',
    createdAt: new Date('2025-06-10'),
    updatedAt: new Date('2025-07-01'),
  },
  {
    id: 'p3',
    name: 'Reparify',
    description: 'App de diagnóstico y reserva de técnicos de hogar con precio fijo y garantía de satisfacción.',
    status: 'review',
    createdAt: new Date('2025-06-25'),
    updatedAt: new Date('2025-07-02'),
  },
  {
    id: 'p4',
    name: 'PadelSocial',
    description: 'Red social para jugadores de pádel amateur: organiza partidos, busca rivales y lleva estadísticas.',
    status: 'generating',
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2025-07-03'),
  },
  {
    id: 'p5',
    name: 'EcoRutas',
    description: 'Marketplace de tours de senderismo con guías locales certificados y huella de carbono calculada.',
    status: 'draft',
    createdAt: new Date('2025-07-03'),
    updatedAt: new Date('2025-07-03'),
  },
  {
    id: 'p6',
    name: 'AulaFlex',
    description: 'Plataforma de microclases grabadas (15–30 min) orientadas a habilidades laborales concretas.',
    status: 'rejected',
    createdAt: new Date('2025-05-15'),
    updatedAt: new Date('2025-05-28'),
  },
]

const store = new Map<string, Project>(mockProjects.map(p => [p.id, { ...p }]))

export const mockProjectService: IProjectService = {
  async listProjects() {
    await delay(200)
    return [...store.values()].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  },

  async getProject(id) {
    await delay(100)
    return store.get(id)
  },

  async createProject(name, description) {
    await delay(300)
    const project: Project = {
      id: `p${Date.now()}`,
      name,
      description,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    store.set(project.id, project)
    return project
  },

  async updateProjectStatus(id, status) {
    await delay(200)
    const project = store.get(id)
    if (!project) throw new Error(`Project ${id} not found`)
    const updated = { ...project, status, updatedAt: new Date() }
    store.set(id, updated)
    return updated
  },
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
