<script setup lang="ts">
import type { CampaignCreative } from '~/types/playground'

defineProps<{ creatives: CampaignCreative[] }>()
</script>

<template>
  <div class="flex flex-col gap-3 h-full overflow-y-auto">
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="creative in creatives"
        :key="creative.id"
        class="group relative rounded-lg overflow-hidden border border-signal-dim bg-elevated"
      >
        <img
          :src="creative.imageUrl"
          :alt="creative.title"
          class="w-full aspect-square object-cover"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-base/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-2">
          <span class="text-xs font-mono text-text-primary text-center leading-tight">{{ creative.title }}</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-2 py-1 text-xs font-body bg-signal text-white rounded hover:bg-[#4E8FE0] transition-colors"
            >
              Regenerar
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs font-body bg-elevated text-text-secondary rounded border border-signal-dim hover:text-text-primary transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
        <div class="px-2 py-1.5 border-t border-signal-dim">
          <p class="text-xs font-mono text-text-muted truncate">{{ creative.title }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
