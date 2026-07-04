<script setup lang="ts">
defineProps<{
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'
}>()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium',
      color === 'green' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/40' :
      color === 'blue' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/40' :
      color === 'yellow' ? 'bg-amber-900/40 text-amber-400 border border-amber-800/40' :
      color === 'red' ? 'bg-red-900/40 text-red-400 border border-red-800/40' :
      color === 'purple' ? 'bg-purple-900/40 text-purple-400 border border-purple-800/40' :
      'bg-surface text-text-muted border border-signal-dim',
    ]"
  >
    <slot />
  </span>
</template>
