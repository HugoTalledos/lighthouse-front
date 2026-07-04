<script setup lang="ts">
defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  id?: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :id="id"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    class="w-full bg-elevated text-text-primary placeholder-text-muted text-sm font-body rounded border border-signal-dim focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal transition-colors duration-150 disabled:opacity-40"
    style="padding: 0.5rem 0.75rem;"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
