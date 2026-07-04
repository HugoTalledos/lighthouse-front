<script setup lang="ts">
defineProps<{
  interactive?: boolean
  elevated?: boolean
}>()
</script>

<template>
  <div
    :class="[
      'bg-surface rounded-lg border transition-all duration-150',
      elevated ? 'bg-elevated' : '',
      interactive
        ? 'border-signal-dim hover:border-signal-mid hover:shadow-signal cursor-pointer active:scale-[0.99]'
        : 'border-signal-dim',
    ]"
  >
    <slot />
  </div>
</template>
