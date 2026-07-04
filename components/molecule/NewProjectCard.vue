<script setup lang="ts">
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="group w-full h-full min-h-[160px] flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-signal-dim hover:border-signal text-text-muted hover:text-text-primary transition-all duration-200 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-base"
    @click="$emit('click')"
  >
    <div class="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-signal-dim group-hover:bg-elevated group-hover:border-signal-mid transition-all duration-200">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <span class="text-sm font-body font-medium">Crear proyecto</span>
  </button>
</template>
