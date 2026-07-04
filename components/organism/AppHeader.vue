<script setup lang="ts">
defineProps<{
  showBack?: boolean
  projectName?: string
}>()
defineEmits<{ back: [] }>()
</script>

<template>
  <header class="flex items-center justify-between h-14 px-6 border-b border-signal-dim bg-base/95 backdrop-blur-sm sticky top-0 z-30 flex-shrink-0">
    <div class="flex items-center gap-3">
      <button
        v-if="showBack"
        type="button"
        class="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm font-body mr-2"
        @click="$emit('back')"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Proyectos
      </button>

      <NuxtLink to="/" class="flex items-center gap-2 group">
        <!-- Faro estilizado -->
        <svg width="22" height="26" viewBox="0 0 22 26" fill="none" aria-hidden="true" class="flex-shrink-0">
          <path d="M11 2v3M9 3h4" stroke="#3B7DD8" stroke-width="1.5" stroke-linecap="round"/>
          <rect x="8" y="6" width="6" height="9" rx="1.5" fill="#3B7DD8"/>
          <path d="M11 6L8 4M11 6l3-2" stroke="#3B7DD8" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
          <path d="M5 15h12l2 9H3l2-9z" fill="#1C2B3A" stroke="#3B7DD8" stroke-width="1" stroke-linejoin="round"/>
          <rect x="9" y="18" width="4" height="6" rx="0.5" fill="#3B7DD8" opacity="0.3"/>
        </svg>
        <span class="font-display font-semibold text-lg tracking-tight">
          <span class="text-text-primary">Light</span><span class="text-signal">◈</span><span class="text-text-primary">house</span>
        </span>
      </NuxtLink>

      <span
        v-if="projectName"
        class="text-text-muted text-sm font-mono truncate max-w-[200px]"
      >
        / {{ projectName }}
      </span>
    </div>

    <slot name="actions" />
  </header>
</template>
