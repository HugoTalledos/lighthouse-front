<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [text: string] }>()

const text = ref('')

function handleSend() {
  const trimmed = text.value.trim()
  if (!trimmed || props.disabled) return
  emit('send', trimmed)
  text.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="flex items-end gap-2 bg-surface border border-signal-dim rounded-xl px-4 py-3 focus-within:border-signal-mid transition-colors duration-150">
    <AtomBaseTextarea
      v-model="text"
      placeholder="Escribe un mensaje… (Intro para enviar)"
      :disabled="disabled"
      :max-rows="1"
      class="flex-1"
      @keydown="handleKeydown"
    />
    <AtomIconButton
      label="Enviar mensaje"
      size="sm"
      :disabled="disabled || !text.trim()"
      class="text-signal hover:text-white hover:bg-signal mb-0.5 flex-shrink-0"
      @click="handleSend"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M14 8L2 2l3.5 6L2 14l12-6z" fill="currentColor"/>
      </svg>
    </AtomIconButton>
  </div>
</template>
