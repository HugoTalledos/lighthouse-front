<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  maxRows?: number
  id?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const el = ref<HTMLTextAreaElement | null>(null)

function autoResize() {
  const ta = el.value
  if (!ta) return
  ta.style.height = 'auto'
  const lineH = 24
  const maxH = (props.maxRows ?? 6) * lineH
  ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px'
}

watch(() => props.modelValue, () => nextTick(autoResize))
</script>

<template>
  <textarea
    :id="id"
    ref="el"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    rows="1"
    class="w-full bg-transparent text-text-primary placeholder-text-muted text-sm font-body resize-none focus:outline-none overflow-y-auto transition-colors duration-150 disabled:opacity-40 leading-6"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value); autoResize()"
  />
</template>
