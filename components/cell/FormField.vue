<script setup lang="ts">
defineProps<{
  label: string
  fieldId?: string
  helpText?: string
  error?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      :for="fieldId"
      class="text-xs font-mono font-medium text-text-secondary uppercase tracking-wider"
    >
      {{ label }}
    </label>
    <slot />
    <p v-if="error" class="text-xs font-body text-red-400">{{ error }}</p>
    <p v-else-if="helpText" class="text-xs font-body text-text-muted">{{ helpText }}</p>
  </div>
</template>
