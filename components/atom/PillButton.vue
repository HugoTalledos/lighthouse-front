<script setup lang="ts">
defineProps<{
  active?: boolean
  disabled?: boolean
}>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'px-4 py-1.5 rounded-full text-sm font-body font-medium transition-all duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-1 focus-visible:ring-offset-base',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      active
        ? 'bg-signal text-white shadow-sm'
        : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface border border-signal-dim',
    ]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>
