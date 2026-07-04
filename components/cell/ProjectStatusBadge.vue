<script setup lang="ts">
import type { ProjectStatus } from '~/types/project'

defineProps<{ status: ProjectStatus }>()

const labels: Record<ProjectStatus, string> = {
  draft: 'Borrador',
  generating: 'Generando',
  review: 'En revisión',
  live: 'En vivo',
  validated: 'Validado',
  rejected: 'Rechazado',
}

const colors: Record<ProjectStatus, 'gray' | 'yellow' | 'blue' | 'green' | 'purple' | 'red'> = {
  draft: 'gray',
  generating: 'yellow',
  review: 'blue',
  live: 'green',
  validated: 'purple',
  rejected: 'red',
}
</script>

<template>
  <AtomBaseBadge :color="colors[status]">
    <span
      v-if="status === 'generating'"
      class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
    />
    {{ labels[status] }}
  </AtomBaseBadge>
</template>
