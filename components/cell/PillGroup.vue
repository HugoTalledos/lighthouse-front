<script setup lang="ts">
defineProps<{
  options: { value: string; label: string }[]
  modelValue: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex items-center gap-1 bg-base rounded-full p-1 border border-signal-dim">
    <AtomPillButton
      v-for="opt in options"
      :key="opt.value"
      :active="modelValue === opt.value"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </AtomPillButton>
  </div>
</template>
