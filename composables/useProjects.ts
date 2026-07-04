import { ref } from 'vue'
import type { Project } from '~/types/project'
import { getProjectService } from '~/services'

export function useProjects() {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const service = getProjectService()

  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      projects.value = await service.listProjects()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconocido'
    } finally {
      loading.value = false
    }
  }

  async function createProject(name: string, description: string) {
    const project = await service.createProject(name, description)
    projects.value.unshift(project)
    return project
  }

  async function approveProject(id: string) {
    const updated = await service.updateProjectStatus(id, 'validated')
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx !== -1) projects.value[idx] = updated
    return updated
  }

  return { projects, loading, error, fetchProjects, createProject, approveProject }
}
