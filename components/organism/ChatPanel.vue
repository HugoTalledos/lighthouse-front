<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '~/types/chat'

const props = defineProps<{
  messages: ChatMessage[]
  isTyping?: boolean
  disabled?: boolean
}>()
defineEmits<{ send: [text: string] }>()

const listEl = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    const el = listEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

watch(() => props.messages.length, scrollToBottom)
watch(() => props.isTyping, scrollToBottom)
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div
      ref="listEl"
      class="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5 scroll-smooth"
    >
      <MoleculeChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />

      <div v-if="isTyping" class="flex gap-3">
        <AtomBaseAvatar role="agent" />
        <CellTypingIndicator />
      </div>

      <div v-if="messages.length === 0 && !isTyping" class="flex flex-col items-center justify-center flex-1 gap-3 py-16 text-center">
        <div class="w-14 h-14 rounded-full bg-surface border border-signal-dim flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3v4M9 5h6M8 9h8l2 12H6L8 9z" stroke="#3B7DD8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="text-text-secondary font-body text-sm">La conversación comenzará aquí.</p>
      </div>
    </div>

    <div class="px-4 pb-4 pt-2 flex-shrink-0 border-t border-signal-dim">
      <MoleculeChatComposer
        :disabled="disabled"
        @send="$emit('send', $event)"
      />
      <p class="text-center text-[10px] font-mono text-text-muted mt-2">
        Shift+Intro para nueva línea
      </p>
    </div>
  </div>
</template>
