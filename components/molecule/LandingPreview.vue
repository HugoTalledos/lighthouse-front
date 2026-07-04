<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ url: string; title?: string }>()

const iframeLoaded = ref(false)
const iframeBlocked = ref(false)

function onLoad() {
  iframeLoaded.value = true
}

function onError() {
  iframeBlocked.value = true
  iframeLoaded.value = true
}

// Detect X-Frame-Options blocking via load timeout
setTimeout(() => {
  if (!iframeLoaded.value) {
    iframeBlocked.value = true
    iframeLoaded.value = true
  }
}, 5000)
</script>

<template>
  <div class="flex flex-col h-full rounded-lg overflow-hidden border border-signal-dim bg-base">
    <div class="flex items-center gap-2 px-3 py-2 bg-elevated border-b border-signal-dim flex-shrink-0">
      <div class="flex gap-1">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span class="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
      </div>
      <span class="text-xs font-mono text-text-muted truncate flex-1">{{ url }}</span>
    </div>

    <div class="relative flex-1">
      <div
        v-if="!iframeLoaded"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-base"
      >
        <AtomBaseSpinner size="md" />
        <span class="text-xs font-mono text-text-muted">Cargando landing…</span>
      </div>

      <div
        v-if="iframeBlocked"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-base"
      >
        <div class="w-12 h-12 rounded-full bg-surface flex items-center justify-center border border-signal-dim">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 3a7 7 0 100 14A7 7 0 0010 3z" stroke="currentColor" stroke-width="1.5" class="text-signal"/>
            <path d="M10 7v4M10 13v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="text-signal"/>
          </svg>
        </div>
        <p class="text-sm font-body text-text-secondary">
          El sitio no permite previsualización incrustada.
        </p>
        <a
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm font-body text-signal hover:underline inline-flex items-center gap-1"
        >
          Abrir en nueva pestaña
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M7 1h4m0 0v4m0-4L5 7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </a>
      </div>

      <iframe
        v-show="iframeLoaded && !iframeBlocked"
        :src="url"
        :title="title ?? 'Landing page'"
        class="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        @load="onLoad"
        @error="onError"
      />
    </div>
  </div>
</template>
