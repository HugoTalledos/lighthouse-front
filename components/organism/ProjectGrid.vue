<script setup lang="ts">
import type { Project } from '~/types/project'

defineProps<{
  projects: Project[]
  loading?: boolean
}>()
defineEmits<{
  'open-project': [project: Project]
  'create-project': []
}>()
</script>

<template>
  <div class="flex-1 overflow-y-auto px-6 py-8">
    <div v-if="loading" class="flex items-center justify-center h-64">
      <AtomBaseSpinner size="lg" />
    </div>

    <div
      v-else
      class="grid gap-4"
      style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));"
    >
      <MoleculeProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        @click="$emit('open-project', project)"
      />
      <MoleculeNewProjectCard @click="$emit('create-project')" />
    </div>

    <div
      v-if="!loading && projects.length === 0"
      class="flex flex-col items-center justify-center h-64 gap-4 text-center"
    >
      <p class="text-text-secondary font-body">Todavía no tienes proyectos.</p>
      <p class="text-text-muted text-sm font-body">Empieza creando uno para validar tu primera idea.</p>
    </div>
  </div>
</template>
