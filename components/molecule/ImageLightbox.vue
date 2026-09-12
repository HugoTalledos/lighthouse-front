<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

defineProps<{
  open: boolean
  src?: string
  alt?: string
}>()

const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      role="dialog"
      aria-modal="true"
      :aria-label="alt"
      class="fixed inset-0 z-50 flex items-center justify-center bg-base/90 p-4"
      @click.self="emit('close')"
    >
      <AtomIconButton
        label="Cerrar"
        class="absolute top-3 right-3"
        @click="emit('close')"
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </AtomIconButton>
      <img
        :src="src"
        :alt="alt"
        class="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-signal"
      />
    </div>
  </Teleport>
</template>
