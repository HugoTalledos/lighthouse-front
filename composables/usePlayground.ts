import { ref } from 'vue'
import type { GeneratedPlan } from '~/types/playground'
import { getPlaygroundService } from '~/services'

export function usePlayground(projectId: string) {
  const plan = ref<GeneratedPlan | null>(null)
  const loading = ref(false)
  const approving = ref(false)
  const approved = ref(false)
  const error = ref<string | null>(null)
  const service = getPlaygroundService()

  async function fetchPlan() {
    loading.value = true
    error.value = null
    try {
      plan.value = await service.getPlan(projectId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar el plan'
    } finally {
      loading.value = false
    }
  }

  async function approvePlan() {
    approving.value = true
    error.value = null
    try {
      await service.approvePlan(projectId)
      approved.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al aprobar el plan'
    } finally {
      approving.value = false
    }
  }

  return { plan, loading, approving, approved, error, fetchPlan, approvePlan }
}
