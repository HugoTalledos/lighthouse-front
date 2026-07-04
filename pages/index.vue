<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjects } from '~/composables/useProjects'
import type { Project } from '~/types/project'

const router = useRouter()
const { projects, loading, fetchProjects, createProject } = useProjects()

onMounted(fetchProjects)

async function handleOpenProject(project: Project) {
  await router.push(`/projects/${project.id}`)
}

async function handleCreateProject() {
  const project = await createProject(
    'Nueva idea',
    'Describe tu idea de negocio para que Lighthouse la valide.',
  )
  await router.push(`/projects/${project.id}`)
}
</script>

<template>
  <div class="flex flex-col h-screen bg-base">
    <OrganismAppHeader>
      <template #actions>
        <AtomBaseButton variant="primary" @click="handleCreateProject">
          Crear proyecto
        </AtomBaseButton>
      </template>
    </OrganismAppHeader>

    <OrganismProjectGrid
      :projects="projects"
      :loading="loading"
      @open-project="handleOpenProject"
      @create-project="handleCreateProject"
    />
  </div>
</template>
