<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChat } from '~/composables/useChat'
import { getProjectService } from '~/services'
import { toGeneratedPlan } from '~/services/projects/projectResourceView'
import type { Project } from '~/types/project'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string

const project = ref<Project | undefined>()
const projectLoading = ref(true)
const showPlayground = ref(false)
const plan = computed(() => project.value ? toGeneratedPlan(project.value) : null)

const { messages, loading: chatLoading, isTyping, error, fetchMessages, sendMessage } = useChat(projectId)

onMounted(async () => {
  try {
    project.value = await getProjectService().getProject(projectId)
    await fetchMessages(project.value?.thread_ids[0])
  } finally {
    projectLoading.value = false
  }
})

async function handleSend(content: string) {
  await sendMessage(content)
  if (!error.value) project.value = await getProjectService().getProject(projectId)
}

// Resizable divider
const MIN_WIDTH = 280
const MAX_WIDTH = 700
const DEFAULT_WIDTH = 420
const playgroundWidth = ref(DEFAULT_WIDTH)
const isResizing = ref(false)
let startX = 0
let startWidth = 0

function onDividerMousedown(e: MouseEvent) {
  isResizing.value = true
  startX = e.clientX
  startWidth = playgroundWidth.value
  document.addEventListener('mousemove', onMousemove)
  document.addEventListener('mouseup', onMouseup)
}

function onMousemove(e: MouseEvent) {
  if (!isResizing.value) return
  const delta = startX - e.clientX
  playgroundWidth.value = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta))
}

function onMouseup() {
  isResizing.value = false
  document.removeEventListener('mousemove', onMousemove)
  document.removeEventListener('mouseup', onMouseup)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onMousemove)
  document.removeEventListener('mouseup', onMouseup)
})
</script>

<template>
  <div class="flex flex-col h-screen bg-base overflow-hidden">
    <OrganismAppHeader
      show-back
      :project-name="project?.business_name ?? 'Proyecto sin nombre'"
      @back="router.push('/')"
    >
      <template #actions>
        <!-- Mobile: toggle playground drawer -->
        <AtomBaseButton
          variant="ghost"
          class="lg:hidden"
          @click="showPlayground = !showPlayground"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="5" height="12" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="9" y="2" width="5" height="12" rx="1" fill="currentColor"/>
          </svg>
          Playground
        </AtomBaseButton>
      </template>
    </OrganismAppHeader>

    <div
      class="flex flex-1 min-h-0"
      :class="{ 'select-none': isResizing }"
    >
      <!-- Chat panel — center -->
      <main
        :class="[
          'flex-1 min-w-0',
          showPlayground ? 'hidden lg:flex' : 'flex',
          'flex-col',
        ]"
      >
        <OrganismChatPanel
          :messages="messages"
          :is-typing="isTyping"
          :error="error"
          :disabled="chatLoading || isTyping"
          @send="handleSend"
        />
      </main>

      <!-- Resize divider — desktop only -->
      <div
        class="hidden lg:flex items-center justify-center w-2 flex-shrink-0 cursor-col-resize group z-10"
        @mousedown.prevent="onDividerMousedown"
      >
        <div
          class="w-0.5 h-full transition-colors duration-150"
          :class="isResizing ? 'bg-signal' : 'bg-signal-dim group-hover:bg-signal'"
        />
      </div>

      <!-- Playground sidebar — right -->
      <aside
        :class="[
          'flex-shrink-0',
          'lg:flex lg:flex-col',
          showPlayground
            ? 'flex flex-col fixed inset-0 top-14 z-20 bg-surface lg:relative lg:inset-auto'
            : 'hidden',
        ]"
        :style="{ width: `${playgroundWidth}px` }"
      >
        <!-- Mobile close -->
        <div class="flex items-center justify-between px-4 py-2 border-b border-signal-dim lg:hidden">
          <span class="text-sm font-mono text-text-secondary">Playground</span>
          <AtomIconButton label="Cerrar playground" @click="showPlayground = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </AtomIconButton>
        </div>

        <OrganismPlaygroundSidebar
          :plan="plan"
          :status="project?.status"
          :loading="projectLoading"
          class="flex-1 min-h-0"
        />
      </aside>
    </div>
  </div>
</template>
