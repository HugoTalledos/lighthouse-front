<script setup lang="ts">
defineProps<{ size?: 'sm' | 'md' | 'lg' }>()
</script>

<template>
  <span
    role="status"
    aria-label="Cargando"
    :class="[
      'inline-block rounded-full border-2 border-signal border-t-transparent animate-spin',
      size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6',
    ]"
  />
</template>
