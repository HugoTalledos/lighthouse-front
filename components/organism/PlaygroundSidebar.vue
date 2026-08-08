<script setup lang="ts">
import { ref } from 'vue'
import type { GeneratedPlan } from '~/types/playground'
import type { ProjectStatus } from '~/types/project'

defineProps<{
  plan: GeneratedPlan | null
  status?: ProjectStatus
  loading?: boolean
}>()

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
          v-if="activeTab === 'landing' && plan.landing"
          :url="plan.landing.url"
          :title="plan.landing.title"
          class="h-full"
        />
        <MoleculeCampaignCreativesGallery
          v-else-if="activeTab === 'creatives'"
          :creatives="plan.creatives"
        />
        <MoleculeCampaignConfigForm
          v-else-if="activeTab === 'campaign' && plan.campaign"
          :config="plan.campaign"
        />
        <div v-else class="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
          <p class="text-text-secondary font-body text-sm">
            Este recurso todavía no ha sido generado por el agente.
          </p>
        </div>
      </template>

      <div v-else class="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
        <p class="text-text-secondary font-body text-sm">
          Los recursos generados aparecerán aquí una vez que el agente los produzca.
        </p>
      </div>
    </div>

    <div class="flex-shrink-0 px-4 pb-4 pt-3 border-t border-signal-dim">
      <div class="flex items-center justify-center gap-2 py-3 rounded-lg bg-elevated border border-signal-dim">
        <CellProjectStatusBadge v-if="status" :status="status" />
        <span class="text-xs font-body text-text-muted">Aprueba recursos conversando con el agente.</span>
      </div>
    </div>
  </div>
</template>
