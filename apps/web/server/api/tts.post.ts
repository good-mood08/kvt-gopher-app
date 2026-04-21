import { ElevenLabsClient, ElevenLabsError } from '@elevenlabs/elevenlabs-js'

const DEFAULT_ELEVEN_MODEL_ID = 'eleven_multilingual_v2'
const DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128'

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const MSG_HTML_INSTEAD_OF_MP3 =
  'ElevenLabs вернул HTML (часто страница Cloudflare), а не MP3. Попробуй VPN или Yandex SpeechKit (NUXT_YANDEX_CLOUD_* в .env).'

const SPEECHKIT_SYNTHESIZE_URL = 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize'

function isProbablyMp3(buffer: ArrayBuffer): boolean {
  const u = new Uint8Array(buffer)
  if (u.length < 3) return false
  if (u[0] === 0x49 && u[1] === 0x44 && u[2] === 0x33) return true
  if (u[0] === 0xff && (u[1] & 0xe0) === 0xe0) return true
  return false
}

function describeNonAudioBody(buffer: ArrayBuffer): string | null {
  const sample = new TextDecoder('utf-8', { fatal: false }).decode(
    new Uint8Array(buffer).slice(0, 512),
  )
  const s = sample.trimStart()
  if (
    s.startsWith('<!DOCTYPE')
    || s.startsWith('<html')
    || sample.includes('Just a moment')
    || sample.includes('cf-chl')
  ) {
    return MSG_HTML_INSTEAD_OF_MP3
  }
  return null
}

function truncateMessage(s: string, max = 600): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

async function synthesizeYandexSpeechKit(params: {
  apiKey: string
  folderId: string
  text: string
  voice: string
  lang: string
}): Promise<ArrayBuffer> {
  const text = params.text.slice(0, 5000)
  const body = new URLSearchParams({
    text,
    lang: params.lang,
    voice: params.voice,
    format: 'mp3',
    folderId: params.folderId,
  })

  const res = await fetch(SPEECHKIT_SYNTHESIZE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${params.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const arrayBuffer = await res.arrayBuffer()
  if (!res.ok) {
    let userMessage = `SpeechKit HTTP ${res.status}`
    try {
      const j = JSON.parse(new TextDecoder().decode(arrayBuffer)) as {
        message?: string
        error_message?: string
        details?: unknown
      }
      userMessage = j.message || j.error_message || userMessage
    } catch {
      userMessage = new TextDecoder().decode(new Uint8Array(arrayBuffer).slice(0, 800)) || userMessage
    }
    throw createError({
      statusCode: res.status === 401 || res.status === 403 ? res.status : 502,
      statusMessage: 'YANDEX_SPEECHKIT_ERROR',
      message: truncateMessage(userMessage),
      data: { userMessage: truncateMessage(userMessage) },
    })
  }

  return arrayBuffer
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody<{
    text?: string
    voiceId?: string
    modelId?: string
    /** Имя голоса SpeechKit (jane, fil, …), если провайдер — Yandex */
    voice?: string
  }>(event).catch(() => ({}))

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Пустой текст' })
  }
  if (text.length > 4096) {
    throw createError({ statusCode: 400, statusMessage: 'Текст длиннее 4096 символов' })
  }

  const yandexKey = (config.yandexCloudApiKey as string)?.trim()
  const yandexFolder = (config.yandexCloudFolderId as string)?.trim()
  const yandexVoiceDefault = ((config.yandexTtsVoice as string) || 'jane').trim()
  const yandexLang = ((config.yandexTtsLang as string) || 'ru-RU').trim()

  if (yandexKey && yandexFolder) {
    const voice =
      typeof body.voice === 'string' && body.voice.trim()
        ? body.voice.trim()
        : yandexVoiceDefault

    const arrayBuffer = await synthesizeYandexSpeechKit({
      apiKey: yandexKey,
      folderId: yandexFolder,
      text,
      voice,
      lang: yandexLang,
    })

    if (!isProbablyMp3(arrayBuffer)) {
      const hint = describeNonAudioBody(arrayBuffer)
      const userMessage = hint || 'Ответ SpeechKit не похож на MP3'
      throw createError({
        statusCode: 502,
        statusMessage: 'SPEECHKIT_NOT_MP3',
        message: userMessage,
        data: { userMessage },
      })
    }

    const buf = new Uint8Array(arrayBuffer)
    setResponseHeader(event, 'content-type', 'audio/mpeg')
    setResponseHeader(event, 'cache-control', 'no-store')
    return buf
  }

  const apiKey = (config.elevenLabsApiKey as string)?.trim()
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Нет провайдера TTS: задай NUXT_YANDEX_CLOUD_API_KEY + NUXT_YANDEX_CLOUD_FOLDER_ID (SpeechKit) или NUXT_ELEVENLABS_API_KEY + NUXT_TTS_VOICE_ID',
    })
  }

  const voiceId =
    typeof body.voiceId === 'string' && body.voiceId.trim()
      ? body.voiceId.trim()
      : ((config.ttsVoiceId as string) || '')
  const modelId =
    typeof body.modelId === 'string' && body.modelId.trim()
      ? body.modelId.trim()
      : ((config.ttsModelId as string) || DEFAULT_ELEVEN_MODEL_ID)

  if (!voiceId) {
    throw createError({
      statusCode: 503,
      statusMessage: 'NUXT_TTS_VOICE_ID не задан — укажи voice id ElevenLabs',
    })
  }

  const client = new ElevenLabsClient({
    apiKey,
    fetch: (url, init) => {
      const headers = new Headers(init?.headers ?? undefined)
      headers.set('User-Agent', BROWSER_UA)
      return fetch(url, { ...init, headers })
    },
  })

  try {
    const stream = await client.textToSpeech.convert(voiceId, {
      text,
      modelId,
      outputFormat: DEFAULT_OUTPUT_FORMAT,
    })

    const arrayBuffer = await new Response(stream as ReadableStream).arrayBuffer()

    if (!isProbablyMp3(arrayBuffer)) {
      const hint = describeNonAudioBody(arrayBuffer)
      const userMessage = hint || 'Ответ ElevenLabs не похож на MP3'
      throw createError({
        statusCode: 502,
        statusMessage: 'ELEVENLABS_NOT_MP3',
        message: userMessage,
        data: { userMessage },
      })
    }

    const buf = new Uint8Array(arrayBuffer)
    setResponseHeader(event, 'content-type', 'audio/mpeg')
    setResponseHeader(event, 'cache-control', 'no-store')
    return buf
  } catch (err: unknown) {
    const elErr = err as ElevenLabsError & { statusCode?: number; message?: string }
    if (err instanceof ElevenLabsError || elErr?.constructor?.name === 'ElevenLabsError') {
      const code = elErr.statusCode ?? 502
      const userMessage = truncateMessage(elErr.message || 'ElevenLabs TTS error')
      throw createError({
        statusCode: code === 401 ? 401 : 502,
        statusMessage: 'ELEVENLABS_API_ERROR',
        message: userMessage,
        data: { userMessage },
      })
    }
    throw err
  }
})
