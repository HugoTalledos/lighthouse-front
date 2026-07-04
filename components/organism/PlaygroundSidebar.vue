<script setup lang="ts">
import { ref } from 'vue'
import type { GeneratedPlan } from '~/types/playground'

defineProps<{
  plan: GeneratedPlan | null
  loading?: boolean
  approving?: boolean
  approved?: boolean
}>()
defineEmits<{ approve: [] }>()

const activeTab = ref('landing')
const tabs = [
  { value: 'landing', label: 'Landing' },
  { value: 'creatives', label: 'Creativos' },
  { value: 'campaign', label: 'Campaña' },
]
</script>

<template>
  <div class="flex flex-col h-full bg-surface border-l border-signal-dim">
    <!-- Header tabs -->
    <div class="flex-shrink-0 px-4 pt-4 pb-3 border-b border-signal-dim">
      <CellPillGroup
        v-model="activeTab"
        :options="tabs"
      />
    </div>

    <!-- Preview area -->
    <div class="flex-1 min-h-0 overflow-hidden px-4 py-4">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <AtomBaseSpinner size="md" />
      </div>

      <template v-else-if="plan">
        <MoleculeLandingPreview
          v-if="activeTab === 'landing'"
          :url="plan.landing.url"
          :title="plan.landing.title"
          class="h-full"
        />
        <MoleculeCampaignCreativesGallery
          v-else-if="activeTab === 'creatives'"
          :creatives="plan.creatives"
        />
        <MoleculeCampaignConfigForm
          v-else-if="activeTab === 'campaign'"
          :config="plan.campaign"
        />
      </template>

      <div v-else class="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
        <p class="text-text-secondary font-body text-sm">
          Los recursos generados aparecerán aquí una vez que el agente los produzca.
        </p>
      </div>
    </div>

    <!-- Footer action -->
    <div class="flex-shrink-0 px-4 pb-4 pt-3 border-t border-signal-dim">
      <div
        v-if="approved"
        class="flex items-center gap-2 justify-center py-3 rounded-lg bg-emerald-900/20 border border-emerald-800/30"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8l4 4 6-7" stroke="#34d399" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="text-sm font-body text-emerald-400">Plan aceptado</span>
      </div>
      <AtomBaseButton
        v-else
        variant="primary"
        :loading="approving"
        :disabled="!plan || approving"
        class="w-full"
        @click="$emit('approve')"
      >
        Aceptar plan y recursos
      </AtomBaseButton>
    </div>
  </div>
</template>
