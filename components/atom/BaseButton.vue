<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-body font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:opacity-40 disabled:cursor-not-allowed rounded',
      variant === 'primary' || !variant
        ? 'bg-signal text-white hover:bg-[#4E8FE0] active:scale-[0.98]'
        : variant === 'secondary'
          ? 'bg-surface text-text-primary border border-signal-dim hover:border-signal-mid hover:bg-elevated active:scale-[0.98]'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface active:scale-[0.98]',
    ]"
    style="padding: 0.5rem 1rem;"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    <slot />
  </button>
</template>
