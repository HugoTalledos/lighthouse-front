<script setup lang="ts">
import type { Project } from '~/types/project'

defineProps<{ project: Project }>()
defineEmits<{ click: [project: Project] }>()

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(date))
}
</script>

<template>
  <AtomBaseCard interactive class="p-5 flex flex-col gap-4 h-full" @click="$emit('click', project)">
    <div class="flex items-start justify-between gap-2">
      <h3 class="text-base font-display font-semibold text-text-primary leading-snug">
        {{ project.business_name ?? 'Proyecto sin nombre' }}
      </h3>
      <CellProjectStatusBadge :status="project.status" class="flex-shrink-0 mt-0.5" />
    </div>
    <p class="text-sm font-body text-text-secondary leading-relaxed flex-1">
      {{ project.value_proposition ?? 'La propuesta de valor aparecerá cuando el agente tenga suficiente contexto.' }}
    </p>
    <div class="flex items-center justify-between pt-2 border-t border-signal-dim">
      <span class="text-xs font-mono text-text-muted">
        Actualizado {{ formatDate(project.updated_at) }}
      </span>
      <span class="text-xs font-body text-signal hover:underline">Abrir →</span>
    </div>
  </AtomBaseCard>
</template>
