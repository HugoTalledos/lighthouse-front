import { ref } from 'vue'
import type { Project } from '~/types/project'
import { getProjectService } from '../services'

export function useProjects(service = getProjectService()) {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  async function createProject(threadId: string) {
    const project = await service.createProject(threadId)
    projects.value.unshift(project)
    return project
  }

  return { projects, loading, error, fetchProjects, createProject }
}
