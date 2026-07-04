export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  srcDir: '.',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
  ],
  tailwindcss: {
    configPath: './tailwind.config.ts',
    cssPath: '~/assets/css/main.css',
  },
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    public: {
      useMocks: process.env.NUXT_PUBLIC_USE_MOCKS ?? 'true',
    },
  },
})
