<script setup lang="ts">
defineProps<{
  disabled?: boolean
  label: string
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-label="label"
    :class="[
      'inline-flex items-center justify-center rounded transition-all duration-150',
      'text-text-secondary hover:text-text-primary hover:bg-surface',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-1 focus-visible:ring-offset-base',
      'disabled:opacity-40 disabled:cursor-not-allowed active:scale-95',
      size === 'sm' ? 'w-7 h-7' : 'w-9 h-9',
    ]"
  >
    <slot />
  </button>
</template>
