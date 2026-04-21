// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
    '@nuxt/ui'
  ],
  yandexMaps: {
    apikey: '77133e2c-3046-41d4-ac56-5081854e5875',
  },
  strapi: {
    url: 'http://localhost:1337',
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
      /** Yandex SpeechKit: голос реплик игрока / выбранного ответа (см. voices в доке SpeechKit) */
      ttsYandexVoicePlayer: 'fil',
      /** Yandex SpeechKit: голос NPC и зачитывания вариантов */
      ttsYandexVoiceNpc: 'jane',
    },
  },
})
