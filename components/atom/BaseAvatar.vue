<script setup lang="ts">
defineProps<{
  role: 'user' | 'agent' | 'system'
  initials?: string
}>()
</script>

<template>
  <div
    :class="[
      'flex-shrink-0 flex items-center justify-center rounded-full text-xs font-mono font-semibold select-none',
      'w-8 h-8',
      role === 'agent'
        ? 'bg-signal text-white'
        : role === 'system'
          ? 'bg-elevated text-text-muted border border-signal-dim'
          : 'bg-elevated text-text-secondary border border-signal-dim',
    ]"
  >
    <template v-if="role === 'agent'">
      <!-- Lighthouse beacon icon -->
      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
        <path d="M7 1v2M7 1L5 3M7 1L9 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="5" y="4" width="4" height="6" rx="1" fill="currentColor" opacity="0.9"/>
        <path d="M3 10h8l1.5 5H1.5L3 10z" fill="currentColor" opacity="0.7"/>
      </svg>
    </template>
    <template v-else-if="role === 'system'">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M6 4v4M4 6h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </template>
    <template v-else>
      {{ initials ?? 'U' }}
    </template>
  </div>
</template>
