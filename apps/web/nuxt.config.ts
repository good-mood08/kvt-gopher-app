// https://nuxt.com/docs/api/configuration/nuxt-config
const strapiUrl = process.env.NUXT_PUBLIC_STRAPI_URL || ''

export default defineNuxtConfig({
  compatibilityDate: '2026-04-22',
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
  css: ['~/assets/css/tailwind.css', '~/assets/index.css', '@/assets/css/fonts.css'],
  modules: [
    'vue-yandex-maps/nuxt',
    '@nuxtjs/strapi',
    'nuxt-swiper',
    '@nuxt/icon',
    '@nuxt/ui',
    '@vite-pwa/nuxt'
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
      enabled: true,
    },
  },
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
      enabled: true,
    },
  },
  yandexMaps: {
    apikey: '77133e2c-3046-41d4-ac56-5081854e5875',
  },
  strapi: {
    url: strapiUrl,
    url: strapiUrl,
    auth: {
      populate: ['role'] // Какие поля подгружать у пользователя
    }
  },
  // Озвучка: Yandex SpeechKit (приоритет, если заданы оба ключа) или ElevenLabs — см. apps/web/.env.example
  runtimeConfig: {
    yandexCloudApiKey: '',
    yandexCloudFolderId: '',
    /** Голос по умолчанию, если клиент не передал voice (SpeechKit) */
    yandexTtsVoice: 'jane',
    yandexTtsLang: 'ru-RU',
    elevenLabsApiKey: '',
    ttsVoiceId: '',
    ttsModelId: 'eleven_multilingual_v2',
    public: {
<<<<<<< Updated upstream
=======
      /** Публичный URL Strapi (API и префикс для `/uploads/...`) */
      strapiUrl,
>>>>>>> Stashed changes
      /** Yandex SpeechKit: голос реплик игрока / выбранного ответа (см. voices в доке SpeechKit) */
      ttsYandexVoicePlayer: 'fil',
      /** Yandex SpeechKit: голос NPC и зачитывания вариантов */
      ttsYandexVoiceNpc: 'jane',
    },
  },
  // Озвучка: Yandex SpeechKit (приоритет, если заданы оба ключа) или ElevenLabs — см. apps/web/.env.example
  runtimeConfig: {
    yandexCloudApiKey: '',
    yandexCloudFolderId: '',
    /** Голос по умолчанию, если клиент не передал voice (SpeechKit) */
    yandexTtsVoice: 'jane',
    yandexTtsLang: 'ru-RU',
    elevenLabsApiKey: '',
    ttsVoiceId: '',
    ttsModelId: 'eleven_multilingual_v2',
    public: {
      /** Публичный URL Strapi (API и префикс для `/uploads/...`) */
      strapiUrl,
      /** Yandex SpeechKit: голос реплик игрока / выбранного ответа (см. voices в доке SpeechKit) */
      ttsYandexVoicePlayer: 'fil',
      /** Yandex SpeechKit: голос NPC и зачитывания вариантов */
      ttsYandexVoiceNpc: 'jane',
    },
  },
})
