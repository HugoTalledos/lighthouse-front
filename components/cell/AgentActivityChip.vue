<script setup lang="ts">
import { computed } from 'vue'
import type { ToolActivity } from '~/types/chat'
import { toolActivityLabel } from '~/services/chat/toolActivityLabel'

const props = defineProps<{ activity: ToolActivity }>()

const label = computed(() => toolActivityLabel(props.activity))
const color = computed(() => {
  if (props.activity.phase === 'running') return 'blue'
  return props.activity.status === 'error' ? 'red' : 'green'
})
</script>

<template>
  <AtomBaseBadge :color="color" aria-live="polite" class="max-w-[240px]">
    <span
      v-if="activity.phase === 'running'"
      class="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0"
    />
    <span class="truncate">{{ label }}</span>
  </AtomBaseBadge>
</template>
