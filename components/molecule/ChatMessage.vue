<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

const props = defineProps<{ message: ChatMessage }>()

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(date)
}
</script>

<template>
  <div
    :class="[
      'flex gap-3 w-full animate-slide-up',
      message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
      message.role === 'system' ? 'justify-center' : '',
    ]"
  >
    <AtomBaseAvatar
      v-if="message.role !== 'system'"
      :role="message.role"
      :initials="message.role === 'user' ? 'Tú' : undefined"
    />

    <div
      :class="[
        'flex flex-col gap-1',
        message.role === 'user' ? 'items-end' : 'items-start',
        message.role === 'system' ? 'items-center' : '',
        message.role === 'system' ? 'w-full max-w-sm' : 'max-w-[75%]',
      ]"
    >
      <CellMessageBubble :role="message.role" :content="message.content" />
      <span class="text-[10px] font-mono text-text-muted px-1">
        {{ formatTime(message.timestamp) }}
      </span>
    </div>
  </div>
</template>
