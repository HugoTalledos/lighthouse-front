<script setup lang="ts">
import type { ProjectStatus } from '~/types/project'

defineProps<{ status: ProjectStatus }>()

const labels: Record<ProjectStatus, string> = {
  in_progress: 'En progreso',
  review: 'En revisión',
  approved: 'Aprobado',
}

const colors: Record<ProjectStatus, 'gray' | 'yellow' | 'blue' | 'green'> = {
  in_progress: 'gray',
  review: 'blue',
  approved: 'green',
}
</script>

<template>
  <AtomBaseBadge :color="colors[status]">
    <span
      v-if="status === 'in_progress'"
      class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
    />
    {{ labels[status] }}
  </AtomBaseBadge>
</template>
