<script setup lang="ts">
import type { ChatRole } from '~/types/chat'

defineProps<{
  role: ChatRole
  content: string
}>()
</script>

<template>
  <div
    :class="[
      'rounded-lg text-sm font-body leading-relaxed whitespace-pre-wrap break-words',
      role === 'user'
        ? 'bg-signal text-white rounded-tr-sm px-4 py-3'
        : role === 'agent'
          ? 'bg-surface text-text-primary border border-signal-dim rounded-tl-sm px-4 py-3'
          : 'bg-elevated text-text-secondary border border-signal-dim rounded px-3 py-2 text-xs font-mono',
    ]"
  >
    {{ content }}
  </div>
</template>
