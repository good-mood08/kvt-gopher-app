import type { Ref } from 'vue'

type Message = Record<string, unknown>

export type StoryOption = { text?: string }

type QueuedUtterance = { text: string; voice?: string }

function formatTtsError(e: unknown): string {
  const err = e as {
    data?: { userMessage?: string; data?: { userMessage?: string } }
    message?: string
    statusMessage?: string
  }
  return (
    err?.data?.userMessage
    || err?.data?.data?.userMessage
    || err?.message
    || err?.statusMessage
    || 'Не удалось получить озвучку'
  )
}

function defaultBuildOptionsScript(opts: ReadonlyArray<StoryOption>): string {
  if (!opts.length) return ''
  const parts = opts.map((o, i) => {
    const t = (o.text ?? '').trim()
    return `Вариант ${i + 1}: ${t || 'без текста'}.`
  })
  return `Выберите ответ. ${parts.join(' ')}`.slice(0, 4096)
}

function publicTtsVoices() {
  const pub = useRuntimeConfig().public as {
    ttsYandexVoicePlayer?: string
    ttsYandexVoiceNpc?: string
  }
  return {
    player: (pub.ttsYandexVoicePlayer || 'fil').trim(),
    npc: (pub.ttsYandexVoiceNpc || 'jane').trim(),
  }
}

/**
 * Автоозвучка: очередь по одной фразе; после конца — следующая реплика или зачитывание вариантов.
 * Голос задаётся через getVoiceForMessage (SpeechKit: разные voice id).
 */
export function useStoryChatTts(params: {
  visibleMessages: Ref<Message[]>
  /** Текст для TTS (без префикса «имя говорит» — голос различает персонажей) */
  buildNarrationScript: (message: Message | undefined) => string
  /** Голос Yandex для строки; для вариантов ответа используется голос NPC */
  getVoiceForMessage?: (message: Message | undefined) => string | undefined
  onTtsError: (msg: string) => void
  canAdvanceStory?: () => boolean
  advanceStory?: () => void
  getCurrentOptions?: () => ReadonlyArray<StoryOption>
  buildOptionsScript?: (opts: ReadonlyArray<StoryOption>) => string
}) {
  const { playText, stop: stopTts, isLoading: ttsLoading, isPlaying: ttsPlaying } = useTts()

  const ttsAutoOn = ref(false)
  const ttsSpokenUpToIndex = ref(0)

  const queue = ref<QueuedUtterance[]>([])
  let draining = false

  let optionsSpokenKey = ''

  watch(
    () => (params.getCurrentOptions?.() ?? []).map(o => String(o.text ?? '')).join('\u0001'),
    (sig) => {
      if (!sig) optionsSpokenKey = ''
    },
  )

  async function maybeAdvanceAfterPlay() {
    if (!ttsAutoOn.value) return

    const opts = params.getCurrentOptions?.() ?? []
    if (opts.length > 0) {
      const key = opts.map(o => String(o.text ?? '')).join('\u0001')
      if (key && key !== optionsSpokenKey) {
        const build = params.buildOptionsScript ?? defaultBuildOptionsScript
        const s = build(opts)
        if (s.trim()) {
          try {
            const { npc } = publicTtsVoices()
            await playText(s, { voice: npc })
            optionsSpokenKey = key
          } catch (e: unknown) {
            params.onTtsError(formatTtsError(e))
          }
        }
      }
      return
    }

    optionsSpokenKey = ''
    if (queue.value.length > 0) return
    if (params.canAdvanceStory?.() && params.advanceStory) {
      params.advanceStory()
    }
  }

  function utteranceForMessage(m: Message | undefined): QueuedUtterance {
    const text = params.buildNarrationScript(m)
    const voice = params.getVoiceForMessage?.(m)
    return { text, voice }
  }

  async function drainQueue() {
    if (draining) return
    draining = true
    try {
      // Доигрываем уже поставленные фразы, даже если авто сняли (конец сюжета) — иначе обрыв и «немая» последняя реплика
      while (queue.value.length > 0) {
        const { text, voice } = queue.value.shift()!
        if (!text?.trim()) continue
        try {
          await playText(text, voice ? { voice } : {})
          await maybeAdvanceAfterPlay()
        } catch (e: unknown) {
          params.onTtsError(formatTtsError(e))
        }
      }
    } finally {
      draining = false
    }
  }

  function enqueue(u: QueuedUtterance) {
    const t = u.text?.trim()
    if (!t || !ttsAutoOn.value) return
    queue.value.push({ text: t, voice: u.voice })
    void drainQueue()
  }

  function flushQueue() {
    queue.value = []
  }

  function disableTtsAuto() {
    ttsAutoOn.value = false
    ttsSpokenUpToIndex.value = 0
    optionsSpokenKey = ''
    flushQueue()
    stopTts()
  }

  function enableTtsAuto() {
    flushQueue()
    ttsAutoOn.value = true
    optionsSpokenKey = ''
    const n = params.visibleMessages.value.length
    if (n === 0) return
    const last = params.visibleMessages.value[n - 1] as Message | undefined
    enqueue(utteranceForMessage(last))
    ttsSpokenUpToIndex.value = n
  }

  function pauseTtsAutoForStoryEnd() {
    ttsAutoOn.value = false
  }

  watch(
    () => params.visibleMessages.value.length,
    (len) => {
      if (!ttsAutoOn.value) return
      const from = ttsSpokenUpToIndex.value
      if (len <= from) return
      for (let i = from; i < len; i++) {
        const m = params.visibleMessages.value[i] as Message | undefined
        enqueue(utteranceForMessage(m))
      }
      ttsSpokenUpToIndex.value = len
    },
  )

  /**
   * Ручной «Дальше» / смена ветки при включённой автоозвучке: остановить текущий звук и очередь,
   * синхронизировать индекс с уже показанными сообщениями — дальше watch добавит TTS только для новых.
   */
  function beforeManualStoryAdvance() {
    if (!ttsAutoOn.value) return
    flushQueue()
    stopTts()
    ttsSpokenUpToIndex.value = params.visibleMessages.value.length
  }

  function onAudioToggle() {
    if (ttsAutoOn.value) {
      disableTtsAuto()
      return
    }
    if (ttsLoading.value || ttsPlaying.value) {
      stopTts()
      return
    }
    if (params.visibleMessages.value.length === 0) {
      params.onTtsError('Пока нечего озвучивать — дождись реплики в чате.')
      return
    }
    enableTtsAuto()
  }

  return {
    ttsAutoOn,
    ttsLoading,
    ttsPlaying,
    disableTtsAuto,
    pauseTtsAutoForStoryEnd,
    beforeManualStoryAdvance,
    onAudioToggle,
  }
}
