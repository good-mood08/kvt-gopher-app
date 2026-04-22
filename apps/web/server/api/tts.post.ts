const MSG_HTML_INSTEAD_OF_MP3 =
  'SpeechKit вернул HTML/текст вместо MP3. Проверь ключ, folderId и доступ к API.'

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

  throw createError({
    statusCode: 503,
    statusMessage:
      'Yandex SpeechKit не настроен: задай NUXT_YANDEX_CLOUD_API_KEY и NUXT_YANDEX_CLOUD_FOLDER_ID',
  })
})
