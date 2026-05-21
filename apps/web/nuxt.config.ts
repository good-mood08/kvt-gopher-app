// https://nuxt.com/docs/api/configuration/nuxt-config
const strapiUrl = process.env.NUXT_PUBLIC_STRAPI_URL || ''
const enablePwaDev = process.env.NUXT_PWA_DEV === 'true'

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: 'ru',
        translate: 'no',
      },
      meta: [
        { name: 'google', content: 'notranslate' },
      ],
    },
  },
  fonts: {
    providers: {
      fontsource: false
    }
  },
  

  compatibilityDate: '2026-04-22',
  components: {
    dirs: [
      {
        path: './components',
        pathPrefix: false,
      },
    ]
  },
  devtools: { enabled: false },
  css: ['~/assets/css/tailwind.css', 'driver.js/dist/driver.css', '~/assets/index.css', '@/assets/css/fonts.css'],
  modules: [
    'vue-yandex-maps/nuxt',
    '@nuxtjs/strapi',
    'nuxt-swiper',
    '@nuxt/icon',
    '@nuxt/ui',
    '@vite-pwa/nuxt'
  ],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'KVT Gopher App',
      short_name: 'KVT Gopher',
      description: 'Геймифицированное приложение KVT Gopher',
      theme_color: '#111827',
      background_color: '#111827',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: enablePwaDev,
    },
  },
  yandexMaps: ({
    apikey: '77133e2c-3046-41d4-ac56-5081854e5875',
    cdnLibraryLoading: {
      extendLibraries: ['@yandex/ymaps3-default-ui-theme@0.0.24'],
    },
  } as any),
  strapi: {
    url: strapiUrl,
    auth: {
      populate: ['role'] 
    }
  },
  runtimeConfig: {
    yandexCloudApiKey: '',
    yandexCloudFolderId: '',
    yandexTtsVoice: 'jane',
    yandexTtsLang: 'ru-RU',
    elevenLabsApiKey: '',
    ttsVoiceId: '',
    ttsModelId: 'eleven_multilingual_v2',
    public: {
      strapiUrl,
      ttsYandexVoicePlayer: 'fil',
      ttsYandexVoiceNpc: 'jane',
    },
  },
})
