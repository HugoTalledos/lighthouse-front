<template>
  <div class="flex items-center gap-1 px-4 py-3 bg-surface rounded-lg rounded-tl-sm border border-signal-dim w-fit">
    <span
      v-for="i in 3"
      :key="i"
      class="inline-block w-2 h-2 rounded-full bg-signal motion-safe:animate-typing-dot"
      :style="{ animationDelay: `${(i - 1) * 0.18}s` }"
    />
  </div>
</template>
