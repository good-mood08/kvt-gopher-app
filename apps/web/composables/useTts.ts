export type TtsPlayOptions = {
  /**
   * Yandex SpeechKit voice name (jane, fil, ...).
   * Ignored by ElevenLabs provider.
   */
  voice?: string
}

// Отладка TTS: раскомментируй при необходимости (или localStorage.ttsDebug = '1' + верни тело)
// function ttsLog(...args: unknown[]) {
//   const debug =
//     import.meta.dev
//     || (import.meta.client && typeof localStorage !== 'undefined' && localStorage.getItem('ttsDebug') === '1')
//   if (!debug) return
//   console.log('[TTS]', ...args)
// }
//
// function ttsWarn(...args: unknown[]) {
//   const debug =
//     import.meta.dev
//     || (import.meta.client && typeof localStorage !== 'undefined' && localStorage.getItem('ttsDebug') === '1')
//   if (!debug) return
//   console.warn('[TTS]', ...args)
// }

/** Как на сервере: MP3 с ID3 или сырой фрейм 0xFFEx */
function isProbablyMp3Buffer(buffer: ArrayBuffer): boolean {
  const u = new Uint8Array(buffer)
  if (u.length < 3) return false
  if (u[0] === 0x49 && u[1] === 0x44 && u[2] === 0x33) return true
  if (u[0] === 0xff && (u[1] & 0xe0) === 0xe0) return true
  return false
}

/**
 * У обёртки fetch иногда `ok === undefined`; тогда `!res.ok` === true и MP3 ошибочно идёт в ветку JSON-ошибки.
 */
function responseHttpOk(res: Response): boolean {
  if (typeof res.ok === 'boolean') return res.ok
  if (typeof res.status === 'number' && res.status >= 200 && res.status < 300) return true
  return false
}

export function useTts() {
  /** Нативный fetch из контекста запроса — без ofetch, тело не «съедается» до arrayBuffer(). */
  const requestFetch = useRequestFetch()

  const currentAudio = ref<HTMLAudioElement | null>(null)
  let objectUrl: string | null = null
  let activeRequestToken = 0

  const isLoading = ref(false)
  const isPlaying = ref(false)

  /** Разбудить ожидание окончания воспроизведения (stop / новый playText). */
  let releasePlaybackWait: (() => void) | null = null

  function cleanupAudio() {
    if (currentAudio.value) {
      currentAudio.value.pause()
      currentAudio.value.removeAttribute('src')
      currentAudio.value.load()
      currentAudio.value = null
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      objectUrl = null
    }
    isPlaying.value = false
  }

  function stop() {
    activeRequestToken += 1
    releasePlaybackWait?.()
    releasePlaybackWait = null
    cleanupAudio()
    isLoading.value = false
  }

  async function playText(text: string, opts: TtsPlayOptions = {}) {
    const trimmed = text?.trim()
    if (!trimmed) {
      throw new Error('Нет текста для озвучки')
    }

    stop()
    const requestToken = activeRequestToken
    isLoading.value = true

    try {
      const res = await requestFetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg,*/*',
        },
        body: JSON.stringify({
          text: trimmed.slice(0, 4096),
          ...(opts.voice ? { voice: opts.voice } : {}),
        }),
      })
      if (requestToken !== activeRequestToken) return

      const contentTypeFromHeaders =
        res.headers && typeof res.headers.get === 'function'
          ? res.headers.get('content-type')
          : null

      const arrayBuffer = await res.arrayBuffer()
      if (requestToken !== activeRequestToken) return
      const decoder = new TextDecoder('utf-8', { fatal: false })

      const httpOk = responseHttpOk(res)
      const looksLikeMp3 = isProbablyMp3Buffer(arrayBuffer)

      // ttsLog('ответ сервера', {
      //   status: res.status,
      //   ok: res.ok,
      //   httpOk,
      //   looksLikeMp3,
      //   contentType: contentTypeFromHeaders,
      //   byteLength: arrayBuffer.byteLength,
      // })

      if (!httpOk && !looksLikeMp3) {
        let userMessage = `Ошибка озвучки (${res.status})`
        const raw = decoder.decode(arrayBuffer)
        // ttsWarn('ошибка API (текст ответа)', raw.slice(0, 2000))
        try {
          const j = JSON.parse(raw) as {
            message?: string
            statusMessage?: string
            data?: { userMessage?: string }
          }
          // ttsWarn('ошибка API (разобранный JSON)', j)
          userMessage =
            j.data?.userMessage
            || j.message
            || j.statusMessage
            || raw.slice(0, 400)
        } catch {
          userMessage = raw.slice(0, 400) || userMessage
        }
        // ttsWarn('сообщение для пользователя', userMessage)
        const err = new Error(userMessage) as Error & { data?: { userMessage: string } }
        err.data = { userMessage }
        throw err
      }

      const mime = contentTypeFromHeaders || 'audio/mpeg'
      const blob = new Blob([arrayBuffer], { type: mime })
      if (!blob || blob.size === 0) {
        // ttsWarn('пустой blob после успешного HTTP')
        throw new Error('Пустой ответ озвучки')
      }

      // ttsLog('аудио готово', { mime, size: blob.size })

      objectUrl = URL.createObjectURL(blob)
      const audio = new Audio(objectUrl)
      currentAudio.value = audio

      audio.onplay = () => {
        if (requestToken !== activeRequestToken) {
          cleanupAudio()
          return
        }
        isPlaying.value = true
      }

      await audio.play()
      if (requestToken !== activeRequestToken) {
        cleanupAudio()
        return
      }

      await new Promise<void>((resolve) => {
        releasePlaybackWait = resolve
        const finish = () => {
          if (requestToken !== activeRequestToken) {
            const r = releasePlaybackWait
            releasePlaybackWait = null
            r?.()
            return
          }
          cleanupAudio()
          const r = releasePlaybackWait
          releasePlaybackWait = null
          r?.()
        }
        if (audio.ended) {
          finish()
          return
        }
        audio.addEventListener('ended', finish, { once: true })
        audio.addEventListener('error', finish, { once: true })
      })
    } catch (e: unknown) {
      releasePlaybackWait?.()
      releasePlaybackWait = null
      cleanupAudio()
      if (requestToken !== activeRequestToken) {
        return
      }
      // ttsWarn('исключение при озвучке', e)
      throw e
    } finally {
      if (requestToken === activeRequestToken) {
        isLoading.value = false
      }
    }
  }

  onUnmounted(() => {
    stop()
  })

  return {
    playText,
    stop,
    isLoading,
    isPlaying,
  }
}

