<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CampaignConfig } from '~/types/playground'

const props = defineProps<{ config: CampaignConfig }>()

const local = ref({ ...props.config })
watch(() => props.config, (c) => { local.value = { ...c } }, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-5 overflow-y-auto pb-2">
    <CellFormField label="Objetivo" field-id="obj">
      <AtomBaseInput id="obj" v-model="local.objective" />
    </CellFormField>

    <CellFormField label="Público objetivo" field-id="audience" help-text="Describe la segmentación demográfica e intereses">
      <AtomBaseInput id="audience" v-model="local.targetAudience" />
    </CellFormField>

    <div class="grid grid-cols-2 gap-4">
      <CellFormField label="Presupuesto diario" field-id="budget" help-text="USD por día">
        <AtomBaseInput id="budget" :model-value="String(local.dailyBudget)" @update:model-value="local.dailyBudget = Number($event)" />
      </CellFormField>

      <CellFormField label="Duración" field-id="duration" help-text="Días">
        <AtomBaseInput id="duration" :model-value="String(local.durationDays)" @update:model-value="local.durationDays = Number($event)" />
      </CellFormField>
    </div>

    <CellFormField label="Copy del anuncio" field-id="copy" help-text="Texto principal del anuncio">
      <AtomBaseTextarea id="copy" v-model="local.adCopy" :max-rows="6" class="bg-elevated border border-signal-dim rounded px-3 py-2 focus:border-signal focus:ring-1 focus:ring-signal" />
    </CellFormField>
  </div>
</template>
