<script setup lang="ts">
import type { DriveStep } from 'driver.js'

const { params } = useRoute()
const { findOne, find, create } = useStrapi()
const { fetchUser } = useStrapiAuth()
const { addExp } = usePlayerDataUser()
const { pushUserNotification } = usePushUserNotification()

const locationId = params.id as string
const location = await findOne('locations', locationId, { populate: ['map', 'game'] })

const locationName = computed(() => {
  const raw = (location as any)?.data?.name
  return typeof raw === 'string' && raw.trim() ? raw.trim() : '[Локация]'
})

type TestCard = {
  statement: string
  is_true: boolean
  fact: string
}

function asCardsArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).cards)) {
    return (payload as any).cards
  }
  return []
}

function normalizeCards(payload: unknown): TestCard[] {
  return asCardsArray(payload)
    .map((item) => {
      const statement = typeof (item as any)?.statement === 'string' ? (item as any).statement.trim() : ''
      const fact = typeof (item as any)?.fact === 'string' ? (item as any).fact.trim() : ''
      const is_true = typeof (item as any)?.is_true === 'boolean' ? (item as any).is_true : null
      if (!statement || !fact || is_true === null) return null
      return { statement, fact, is_true }
    })
    .filter((card): card is TestCard => card !== null)
}

/** Fisher–Yates: новый массив в случайном порядке (при каждом старте игры). */
function shuffleCards(cards: TestCard[]): TestCard[] {
  const out = [...cards]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = out[i]!
    out[i] = out[j]!
    out[j] = tmp
  }
  return out
}

const gameEntity = (location as any)?.data?.game
const rawGameData =
  gameEntity?.data?.data
  ?? gameEntity?.data?.attributes?.data
  ?? gameEntity?.data
  ?? gameEntity?.attributes?.data
  ?? gameEntity?.data
  ?? null

const testCards = ref<TestCard[]>(shuffleCards(normalizeCards(rawGameData)))
if (!testCards.value.length) {
  console.warn('[locationGame] game.data is empty or invalid for location', { locationId, rawGameData })
}

type Phase = 'question' | 'fact'

const currentIndex = ref(0)
const currentCard = computed(() => testCards.value[currentIndex.value] || null)
const quizFinished = computed(() => currentIndex.value >= testCards.value.length)
const phase = ref<Phase>('question')
const mapId = computed(() => (location as any)?.data?.map?.documentId as string | undefined)

const SWIPE_THRESHOLD = 90
const cardOffsetX = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const resultFact = ref('')
const pickedAnswer = ref<boolean | null>(null)
const pickedAnswerCorrect = ref<boolean | null>(null)
const revealStage = ref<'idle' | 'picked' | 'fact'>('idle')
const correctCount = ref(0)
const completionState = ref<
  'idle' | 'saving' | 'saved_new' | 'saved_repeat' | 'failed' | 'error'
>('idle')

function completionDoneOk(state: string) {
  return state === 'saved_new' || state === 'saved_repeat'
}
const factEntering = ref(false)
const factEnterSide = ref<1 | -1>(1)
const finalEntering = ref(false)
const finalEnterSide = ref<1 | -1>(1)
const finalCardOffsetX = ref(0)
const finishPersistArmed = ref(false)

const cardStyle = computed(() => {
  const rotate = cardOffsetX.value / 18
  const transition = isDragging.value
    ? 'none'
    : factEntering.value
      ? 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)'
      : 'transform 0.34s ease'

  return {
    transform: `translateX(${cardOffsetX.value}px) rotate(${rotate}deg)`,
    transition,
  }
})

const finalCardStyle = computed(() => {
  const rotate = finalCardOffsetX.value / 20
  return {
    transform: `translateX(${finalCardOffsetX.value}px) rotate(${rotate}deg)`,
    transition: finalEntering.value
      ? 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)'
      : 'transform 0.34s ease',
  }
})

/** Лёгкий parallax фона от свайпа (без плашек). */
const backdropShiftStyle = computed(() => ({
  transform: `translateX(${cardOffsetX.value * 0.06}px) skewX(${cardOffsetX.value * 0.012}deg)`,
}))

const glowClass = computed(() => {
  if (phase.value === 'fact') return 'glow-fact'
  if (cardOffsetX.value > 24) return 'glow-right'
  if (cardOffsetX.value < -24) return 'glow-left'
  return ''
})

const directionLabel = computed(() => {
  const idx = Math.min(currentIndex.value + 1, testCards.value.length)
  const total = testCards.value.length
  if (phase.value === 'fact') return `Пояснение ${idx} из ${total}`
  return `Вопрос ${idx} из ${total}`
})

const activeCardText = computed(() => {
  if (!currentCard.value) return ''
  return phase.value === 'question' ? currentCard.value.statement : resultFact.value
})

const choiceFeedbackClass = computed(() => {
  if (revealStage.value === 'fact') return 'fact-visible'
  return ''
})

const factBadgeText = computed(() => {
  if (pickedAnswerCorrect.value === null) return ''
  return pickedAnswerCorrect.value ? 'Правильно' : 'Неправильно'
})

const answeredCount = computed(() => {
  const answeredNow = phase.value === 'fact' ? 1 : 0
  return Math.min(currentIndex.value + answeredNow, testCards.value.length)
})

const wrongCount = computed(() => Math.max(answeredCount.value - correctCount.value, 0))
const progressTrackStyle = computed(() => ({
  '--segments': `${Math.max(testCards.value.length, 1)}`,
}))

const voteMoodClass = computed(() => {
  if (phase.value === 'fact') {
    if (pickedAnswerCorrect.value === true) return 'mood-truth-locked'
    if (pickedAnswerCorrect.value === false) return 'mood-lie-locked'
    return ''
  }
  if (revealStage.value === 'picked') {
    return pickedAnswerCorrect.value ? 'mood-truth' : 'mood-lie'
  }
  if (cardOffsetX.value > 24) return 'mood-truth'
  if (cardOffsetX.value < -24) return 'mood-lie'
  return ''
})

const answerFlareClass = computed(() => {
  if (phase.value !== 'fact') return ''
  return pickedAnswerCorrect.value ? 'flare-correct' : 'flare-wrong'
})

/** Строго больше половины вопросов отвечено верно — тогда EXP и запись о прохождении. */
function quizPassedThreshold(): boolean {
  const total = testCards.value.length
  return total > 0 && correctCount.value > total / 2
}

const completionHint = computed(() => {
  if (completionState.value === 'saving') return 'Фиксируем прохождение...'
  if (completionState.value === 'saved_new') {
    return 'Прогресс записан, +50 EXP на счёт. Можно закрыть точку.'
  }
  if (completionState.value === 'saved_repeat') {
    return 'Ты уже проходил эту точку — награды нет, это тренировка. Закрой точку, когда будешь готов.'
  }
  if (completionState.value === 'failed') {
    return `Нужно больше половины верных ответов (${correctCount.value} из ${testCards.value.length}). Попробуй ещё раз или закрой точку без зачёта.`
  }
  if (completionState.value === 'error') return 'Не удалось сохранить. Нажми «Закрыть точку» ещё раз.'
  return 'Готово к закрытию точки'
})

const finalTitle = computed(() => {
  if (completionState.value === 'failed') return 'Раунд завершён'
  if (completionState.value === 'saved_new') return 'Победа!'
  if (completionState.value === 'saved_repeat') return 'Уже проходил'
  return 'Конец раунда'
})

const GAME_TUTORIAL_STORAGE_KEY = 'location-game-card-driver-tour-seen-v3'
const { startQuestTour } = useQuestOnboardingTour()
const gameTourSteps: DriveStep[] = [
  {
    element: '[data-tour="game-progress"]',
    popover: {
      title: 'Прогресс задания',
      description: 'Полоски показывают, сколько карточек уже пройдено и какая карточка активна сейчас.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="game-card"]',
    popover: {
      title: 'Карточка вопроса',
      description: 'Потяните карточку влево, если утверждение ложное, или вправо, если оно правдивое.',
      side: 'over',
      align: 'center',
    },
  },
  {
    popover: {
      title: 'Факт после ответа',
      description: 'После свайпа откроется пояснение. Прочитайте его и свайпните карточку еще раз, чтобы перейти дальше.',
    },
  },
  {
    popover: {
      title: 'Как получить зачет',
      description: 'Нужно ответить верно больше чем на половину карточек. Если не получилось, можно пройти точку еще раз.',
    },
  },
]

function onCardPointerDown(event: PointerEvent) {
  isDragging.value = true
  dragStartX.value = event.clientX - cardOffsetX.value
}

function onCardPointerMove(event: PointerEvent) {
  if (!isDragging.value) return
  cardOffsetX.value = event.clientX - dragStartX.value
}

function onCardPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false

  if (Math.abs(cardOffsetX.value) < SWIPE_THRESHOLD) {
    cardOffsetX.value = 0
    return
  }

  if (phase.value === 'question') {
    handleQuestionSwipe(cardOffsetX.value > 0)
    return
  }

  handleFactSwipe(cardOffsetX.value >= 0)
}

function handleQuestionSwipe(pickedTrue: boolean) {
  if (!currentCard.value) return

  factEnterSide.value = pickedTrue ? 1 : -1
  cardOffsetX.value = pickedTrue ? 560 : -560
  const correct = pickedTrue === currentCard.value.is_true
  pickedAnswer.value = pickedTrue
  pickedAnswerCorrect.value = correct
  if (correct) {
    correctCount.value += 1
  }
  revealStage.value = 'picked'
  resultFact.value = currentCard.value.fact

  setTimeout(() => {
    revealStage.value = 'fact'
  }, 170)

  setTimeout(() => {
    phase.value = 'fact'
    factEntering.value = true
    cardOffsetX.value = factEnterSide.value * 560
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cardOffsetX.value = 0
      })
    })
    setTimeout(() => {
      factEntering.value = false
    }, 460)
  }, 260)
}

function handleFactSwipe(toRight: boolean) {
  const isLastCard = currentIndex.value >= testCards.value.length - 1
  finalEnterSide.value = toRight ? 1 : -1
  cardOffsetX.value = toRight ? 560 : -560
  setTimeout(() => {
    currentIndex.value += 1
    if (isLastCard) {
      finishPersistArmed.value = true
    }
    resetToQuestion()
  }, 240)
}

function restartQuiz() {
  testCards.value = shuffleCards(normalizeCards(rawGameData))
  currentIndex.value = 0
  correctCount.value = 0
  completionState.value = 'idle'
  finalEntering.value = false
  finalCardOffsetX.value = 0
  finishPersistArmed.value = false
  resetToQuestion()
}

function resetToQuestion() {
  phase.value = 'question'
  cardOffsetX.value = 0
  factEntering.value = false
  isDragging.value = false
  dragStartX.value = 0
  resultFact.value = ''
  pickedAnswer.value = null
  pickedAnswerCorrect.value = null
  revealStage.value = 'idle'
}

const openTutorial = async () => {
  await startQuestTour({
    storageKey: GAME_TUTORIAL_STORAGE_KEY,
    steps: gameTourSteps,
    force: true,
    waitFor: ['[data-tour="game-progress"]', '[data-tour="game-card"]'],
  })
}

async function persistLocationProgress() {
  if (completionState.value === 'saving' || completionDoneOk(completionState.value)) return

  completionState.value = 'saving'
  console.info('[locationGame] persist start', {
    locationId,
    correctCount: correctCount.value,
    total: testCards.value.length,
    passed: quizPassedThreshold(),
  })

  if (!quizPassedThreshold()) {
    completionState.value = 'failed'
    console.info('[locationGame] порог не пройден — прогресс и EXP не выдаём', {
      correctCount: correctCount.value,
      total: testCards.value.length,
    })
    return
  }

  try {
    const user = await fetchUser()
    const userId = user.value?.documentId
    if (!userId) throw new Error('NO_USER')

    console.info('[locationGame] query existing user-location-progresses', { userId, locationId })
    const existing = await find('user-location-progresses', {
      filters: {
        users_permissions_user: { documentId: { $eq: userId } },
        location: { documentId: { $eq: locationId } },
      },
    })

    if (!existing?.data?.length) {
      console.info('[locationGame] progress not found, creating record', { userId, locationId })
      await create('user-location-progresses', {
        users_permissions_user: userId,
        location: locationId,
      })
      console.info('[locationGame] progress record created', { userId, locationId })
      try {
        await addExp(50)
      }
      catch (expErr) {
        console.error('[locationGame] начисление EXP за прохождение с порогом', expErr)
      }
      await pushUserNotification({
        text: `Локация «${locationName.value}» пройдена.`,
        type: 'success',
        category: 'system',
      })
    } else {
      console.info('[locationGame] progress already exists, skip create and EXP', {
        userId,
        locationId,
        existingCount: existing.data.length,
      })
      completionState.value = 'saved_repeat'
      console.info('[locationGame] persist repeat visit', { locationId })
      return
    }

    completionState.value = 'saved_new'
    console.info('[locationGame] persist success (first clear)', { locationId, completionState: completionState.value })
  } catch (error) {
    console.error('Ошибка при сохранении прохождения локации:', error)
    completionState.value = 'error'
    console.error('[locationGame] persist failed', { locationId, completionState: completionState.value, error })
  }
}

async function closePoint() {
  if (!completionDoneOk(completionState.value) && completionState.value !== 'failed') {
    await persistLocationProgress()
  }
  if (!completionDoneOk(completionState.value) && completionState.value !== 'failed') return

  if (mapId.value) {
    await navigateTo(`/map/${mapId.value}`)
    return
  }
  await navigateTo('/general')
}

watch(quizFinished, (finished) => {
  if (finished && finishPersistArmed.value && testCards.value.length > 0) {
    finalEntering.value = true
    finalCardOffsetX.value = finalEnterSide.value * 560
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        finalCardOffsetX.value = 0
      })
    })
    setTimeout(() => {
      finalEntering.value = false
    }, 460)
    void persistLocationProgress()
    return
  }
  finalEntering.value = false
  finalCardOffsetX.value = 0
})

onMounted(() => {
  setTimeout(() => {
    void startQuestTour({
      storageKey: GAME_TUTORIAL_STORAGE_KEY,
      steps: gameTourSteps,
      waitFor: ['[data-tour="game-progress"]', '[data-tour="game-card"]'],
    })
  }, 500)
})
</script>

<template>
  <div class="swipe-page">
    <section class="swipe-lab">
      <div class="lab-grain" aria-hidden="true" />
      <header class="phone-header">
        <div class="flex items-center justify-between gap-3">
          <div class="h-9 w-9" aria-hidden="true" />
          <p class="game-title flex-1">Архи-факт</p>
          <button
            type="button"
            data-tour="game-help"
            class="relative z-10 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Открыть обучение"
            @click="openTutorial"
          >
            <Icon class="text-[20px]" name="material-symbols:help-rounded" />
          </button>
        </div>
        <p class="location-name">{{ locationName }}</p>
        <div class="progress-track" :style="progressTrackStyle" data-tour="game-progress">
          <div
            v-for="(_, idx) in testCards"
            :key="idx"
            class="progress-segment"
            :class="{ done: idx < currentIndex, active: idx === currentIndex && !quizFinished }"
          />
        </div>
      </header>

      <template v-if="testCards.length && !quizFinished && currentCard">
        <div class="swipe-area" :class="voteMoodClass">
          <div class="backdrop-mood" :style="backdropShiftStyle" aria-hidden="true">
            <div class="mood-orb mood-orb-a" />
            <div class="mood-orb mood-orb-b" />
            <div class="mood-columns" />
            <div class="mood-arc" />
            <div class="mood-rings" />
            <span class="mood-spark mood-spark-1" />
            <span class="mood-spark mood-spark-2" />
            <span class="mood-spark mood-spark-3" />
          </div>
          <div class="answer-flare" :class="answerFlareClass" />

          <article
            class="fact-card"
            data-tour="game-card"
            :class="[glowClass, { 'fact-phase': phase === 'fact', 'fact-entering': factEntering, 'fact-correct': phase === 'fact' && pickedAnswerCorrect === true, 'fact-wrong': phase === 'fact' && pickedAnswerCorrect === false }]"
            :style="cardStyle"
            @pointerdown="onCardPointerDown"
            @pointermove="onCardPointerMove"
            @pointerup="onCardPointerUp"
            @pointercancel="onCardPointerUp"
          >
            <p class="card-top-label">{{ directionLabel }}</p>
            <p v-if="phase === 'fact'" class="fact-badge" :class="pickedAnswerCorrect ? 'ok' : 'bad'">
              <span class="fact-badge-icon">{{ pickedAnswerCorrect ? '✓' : '✕' }}</span>
              <span>{{ factBadgeText }}</span>
            </p>
            <p class="main-text">{{ activeCardText }}</p>
          </article>
        </div>

        <div class="choice-feedback" :class="choiceFeedbackClass" aria-live="polite" data-tour="game-feedback">
          <template v-if="revealStage === 'idle' && phase === 'question'">
            <span class="choice-pill lie">Влево: Ложь</span>
            <span class="choice-divider" />
            <span class="choice-pill truth">Вправо: Правда</span>
          </template>
          <template v-else-if="phase === 'fact'">
            <span class="choice-state">Факт открыт</span>
          </template>
        </div>
        <p class="micro-tip">
          {{ phase === 'question' ? 'Свайпни карточку, чтобы проголосовать' : 'Свайпни ещё раз, чтобы перейти к следующему факту' }}
        </p>
      </template>

      <template v-else>
        <div
          v-if="testCards.length"
          class="swipe-area final-area mood-truth-locked"
          :class="{ 'final-area--celebrate': completionState === 'saved_new' }"
        >
          <div v-if="completionState === 'saved_new'" class="win-fx" aria-hidden="true">
            <span
              v-for="n in 22"
              :key="n"
              class="win-confetti"
              :style="{
                left: `${(n * 37) % 88 + 6}%`,
                animationDelay: `${n * 0.045}s`,
                background: `hsl(${(n * 31) % 360}, 78%, ${52 + (n % 3) * 6}%)`,
              }"
            />
          </div>
          <div class="backdrop-mood" aria-hidden="true">
            <div class="mood-orb mood-orb-a" />
            <div class="mood-orb mood-orb-b" />
            <div class="mood-columns" />
            <div class="mood-arc" />
            <div class="mood-rings" />
          </div>
          <div
            class="final-card-wrap"
            :class="{ 'final-card-wrap--won': completionState === 'saved_new' }"
          >
            <article
              class="fact-card final-card glow-fact"
              :class="{ 'final-entering': finalEntering }"
              :style="finalCardStyle"
            >
              <p class="card-top-label">Конец раунда</p>
              <p class="main-text final-main-title">{{ finalTitle }}</p>
              <div class="final-actions">
                <button class="final-btn primary" :disabled="completionState === 'saving'" @click="closePoint">
                  {{ completionState === 'saving' ? 'Сохраняем...' : 'Закрыть точку' }}
                </button>
                <button class="final-btn" @click="restartQuiz">Пройти ещё раз</button>
              </div>
            </article>
          </div>
        </div>
        <template v-if="testCards.length">
          <div class="choice-feedback final-feedback">{{ completionHint }}</div>
        </template>
        <template v-else>
          <div class="choice-feedback final-feedback">Для этой точки не настроены карточки в `game.data`</div>
        </template>
      </template>
    </section>

  </div>
</template>

<style scoped>
.swipe-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background:
    radial-gradient(circle at 14% 18%, rgba(147, 197, 253, 0.2) 0%, transparent 36%),
    radial-gradient(circle at 82% 86%, rgba(110, 231, 183, 0.16) 0%, transparent 34%),
    #f7fafc;
  position: relative;
  overflow: hidden;
}

.swipe-page::before {
  content: '';
  position: absolute;
  inset: -16% -10%;
  pointer-events: none;
  background:
    radial-gradient(circle at 22% 72%, rgba(14, 165, 233, 0.1) 0%, transparent 32%),
    radial-gradient(circle at 78% 22%, rgba(99, 102, 241, 0.08) 0%, transparent 34%),
    repeating-linear-gradient(
      120deg,
      rgba(148, 163, 184, 0.06) 0,
      rgba(148, 163, 184, 0.06) 1px,
      transparent 1px,
      transparent 24px
    );
  opacity: 0.55;
  animation: page-glow-drift 24s ease-in-out infinite;
}

.swipe-page::after {
  content: '';
  position: absolute;
  width: min(72vw, 560px);
  height: min(72vw, 560px);
  left: -20%;
  top: 58%;
  transform: translateY(-50%);
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0) 68%);
  filter: blur(4px);
  animation: page-orb-drift 28s ease-in-out infinite;
}

.swipe-lab {
  width: min(100%, 380px);
  background: #ffffff;
  backdrop-filter: blur(6px);
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.08);
  position: relative;
  overflow: hidden;
  animation: lab-breathe 11s ease-in-out infinite;
}

.swipe-lab::before {
  content: '';
  position: absolute;
  top: -90px;
  right: -70px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.3) 0%, transparent 72%);
  pointer-events: none;
  animation: ambient-orb-a 14s ease-in-out infinite;
}

.swipe-lab::after {
  content: '';
  position: absolute;
  left: -84px;
  bottom: -86px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, transparent 72%);
  pointer-events: none;
  animation: ambient-orb-b 16s ease-in-out infinite;
}

.lab-grain {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(15, 23, 42, 0.06) 0.6px, transparent 0.6px);
  background-size: 6px 6px;
  opacity: 0.14;
  pointer-events: none;
}

.phone-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.game-title {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-align: center;
}

.location-name {
  margin: 0;
  color: #6b7280;
  text-align: center;
}

.progress-track {
  display: grid;
  grid-template-columns: repeat(var(--segments), minmax(0, 1fr));
  gap: 6px;
}

.progress-segment {
  height: 6px;
  border-radius: 999px;
  background: #e2e8f0;
}

.progress-segment.done {
  background: #93c5fd;
}

.progress-segment.active {
  background: #4f7dff;
}

.swipe-area {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  z-index: 1;
}

.answer-flare {
  position: absolute;
  inset: 12% 10% 10%;
  border-radius: 20px;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
}

.answer-flare.flare-correct {
  animation: answer-flare-correct 0.55s ease-out;
}

.answer-flare.flare-wrong {
  animation: answer-flare-wrong 0.55s ease-out;
}

.swipe-area::after {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 6px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.35), transparent);
  z-index: 1;
}

.backdrop-mood {
  position: absolute;
  inset: 12px 10px 14px;
  z-index: 0;
  border-radius: 22px;
  overflow: hidden;
  transition: transform 0.24s ease, background 0.55s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  background: linear-gradient(180deg, #f1f5f9 0%, #e8eef7 40%, #eef2ff 100%);
}

.backdrop-mood::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.35) 45%, transparent 70%);
  opacity: 0.5;
  animation: mood-sheen 12s linear infinite;
}

.swipe-area.mood-truth .backdrop-mood,
.swipe-area.mood-truth-locked .backdrop-mood {
  background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 44%, #ecfeff 100%);
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.14);
}

.swipe-area.mood-lie .backdrop-mood,
.swipe-area.mood-lie-locked .backdrop-mood {
  background: linear-gradient(180deg, #fff1f2 0%, #ffe4e6 45%, #fff7ed 100%);
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.14);
}

.mood-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.55;
  pointer-events: none;
}

.mood-orb-a {
  width: 180%;
  height: 55%;
  left: -40%;
  top: -18%;
  background: radial-gradient(circle, #bfdbfe 0%, transparent 70%);
  animation: drift-a 18s ease-in-out infinite;
}

.mood-orb-b {
  width: 140%;
  height: 50%;
  right: -35%;
  bottom: -12%;
  background: radial-gradient(circle, #fde68a 0%, transparent 68%);
  opacity: 0.35;
  animation: drift-b 22s ease-in-out infinite;
}

.mood-columns {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image: repeating-linear-gradient(
    90deg,
    #64748b 0,
    #64748b 1px,
    transparent 1px,
    transparent 28px
  );
  mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
}

.mood-arc {
  position: absolute;
  left: 50%;
  bottom: -8%;
  width: 140%;
  height: 42%;
  transform: translateX(-50%);
  border: 2px solid rgba(148, 163, 184, 0.22);
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  pointer-events: none;
}

.mood-rings {
  position: absolute;
  inset: auto 10% 8% 10%;
  height: 34%;
  border-radius: 999px 999px 0 0;
  border-top: 2px solid rgba(148, 163, 184, 0.22);
  border-left: 2px solid transparent;
  border-right: 2px solid transparent;
  opacity: 0.8;
}

.mood-spark {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(79, 125, 255, 0.35);
  filter: blur(0.3px);
  animation: spark-float 8s ease-in-out infinite;
  transition: background-color 0.5s ease, opacity 0.5s ease;
}

.mood-spark-1 {
  left: 18%;
  top: 26%;
  animation-delay: 0.2s;
}

.mood-spark-2 {
  right: 18%;
  top: 42%;
  animation-delay: 1.1s;
}

.mood-spark-3 {
  left: 52%;
  bottom: 24%;
  animation-delay: 0.6s;
}

.swipe-area.mood-truth .mood-spark,
.swipe-area.mood-truth-locked .mood-spark {
  background: rgba(16, 185, 129, 0.35);
}

.swipe-area.mood-lie .mood-spark,
.swipe-area.mood-lie-locked .mood-spark {
  background: rgba(239, 68, 68, 0.32);
}

@keyframes drift-a {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(6%, 4%) scale(1.05);
  }
}

@keyframes drift-b {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-5%, -3%);
  }
}

@keyframes spark-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-8px) scale(1.12);
    opacity: 0.9;
  }
}

@keyframes answer-flare-correct {
  0% {
    opacity: 0.55;
    box-shadow: inset 0 0 0 2px rgba(34, 197, 94, 0.45), 0 0 0 0 rgba(34, 197, 94, 0.24);
  }
  100% {
    opacity: 0;
    box-shadow: inset 0 0 0 2px rgba(34, 197, 94, 0), 0 0 0 22px rgba(34, 197, 94, 0);
  }
}

@keyframes answer-flare-wrong {
  0% {
    opacity: 0.55;
    box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.42), 0 0 0 0 rgba(239, 68, 68, 0.22);
  }
  100% {
    opacity: 0;
    box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0), 0 0 0 22px rgba(239, 68, 68, 0);
  }
}

.fact-card {
  --fact-accent: 37, 99, 235;
  width: min(100%, 300px);
  min-height: 420px;
  border-radius: 20px;
  border: 1px solid #dbe3ef;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
  padding: 28px 22px;
  cursor: grab;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  touch-action: none;
  position: relative;
  z-index: 3;
  gap: 10px;
  transition: box-shadow 0.42s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.42s cubic-bezier(0.22, 1, 0.36, 1), background 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.fact-card:active {
  cursor: grabbing;
}

.card-top-label {
  position: absolute;
  top: 18px;
  left: 18px;
  margin: 0;
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.main-text {
  margin: 0;
  font-size: 18px;
  line-height: 1.55;
  color: #0f172a;
  max-width: 100%;
}

.fact-card.glow-right {
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3), 0 0 24px rgba(16, 185, 129, 0.22), 0 10px 24px rgba(15, 23, 42, 0.1);
}

.fact-card.glow-left {
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.26), 0 0 24px rgba(220, 38, 38, 0.16), 0 10px 24px rgba(15, 23, 42, 0.1);
}

.fact-card.glow-fact {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.22), 0 8px 24px rgba(37, 99, 235, 0.14), 0 10px 24px rgba(15, 23, 42, 0.1);
}

.fact-card.fact-phase {
  --fact-accent: 37, 99, 235;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  animation: fact-enter 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.fact-card.fact-phase.fact-entering {
  will-change: transform;
}

.fact-card.fact-correct {
  --fact-accent: 34, 197, 94;
  border-color: rgba(34, 197, 94, 0.35);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.18), 0 16px 30px rgba(34, 197, 94, 0.12), 0 10px 24px rgba(15, 23, 42, 0.1);
}

.fact-card.fact-wrong {
  --fact-accent: 239, 68, 68;
  border-color: rgba(239, 68, 68, 0.35);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.16), 0 16px 30px rgba(239, 68, 68, 0.1), 0 10px 24px rgba(15, 23, 42, 0.1);
}

.fact-card.fact-phase::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 26px;
  pointer-events: none;
  border: 2px solid rgba(var(--fact-accent), 0.25);
  animation: fact-halo 0.68s ease-out;
}

.fact-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  margin: 0;
  height: 28px;
  padding: 0 10px 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  animation: badge-pop 0.4s ease;
}

.fact-badge.ok {
  background: #dcfce7;
  color: #166534;
  border: 1px solid rgba(34, 197, 94, 0.45);
}

.fact-badge.bad {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.fact-badge-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
}

.choice-feedback {
  min-height: 36px;
  border-radius: 999px;
  border: 1px solid #dbeafe;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.9));
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 6px 12px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
  align-self: center;
  width: min(100%, 320px);
  z-index: 1;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
  transition: border-color 0.35s ease, color 0.35s ease, background 0.35s ease, box-shadow 0.35s ease;
}

.micro-tip {
  margin: 4px 0 0;
  text-align: center;
  color: #64748b;
  font-size: 11px;
  letter-spacing: 0.015em;
}

.choice-pill {
  white-space: nowrap;
  border-radius: 999px;
  padding: 3px 8px;
  border: 1px solid transparent;
}

.choice-pill.truth {
  color: #334155;
  border-color: rgba(148, 163, 184, 0.35);
  background: rgba(248, 250, 252, 0.85);
}

.choice-pill.lie {
  color: #334155;
  border-color: rgba(148, 163, 184, 0.35);
  background: rgba(248, 250, 252, 0.85);
}

.choice-divider {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
  flex-shrink: 0;
}

.choice-state {
  animation: choice-pop 0.34s ease;
}

.choice-state b {
  margin-left: 6px;
}

.choice-feedback.fact-visible {
  border-color: rgba(37, 99, 235, 0.35);
  color: #1d4ed8;
  background: rgba(239, 246, 255, 0.94);
  box-shadow: 0 0 0 2px rgba(79, 125, 255, 0.08);
}

@keyframes choice-pop {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fact-enter {
  0% {
    filter: brightness(1.08) saturate(1.08);
    opacity: 0.72;
  }
  100% {
    filter: brightness(1) saturate(1);
    opacity: 1;
  }
}

@keyframes badge-pop {
  0% {
    opacity: 0;
    transform: translateY(-6px) scale(0.92);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fact-halo {
  0% {
    opacity: 0.65;
    transform: scale(0.96);
  }
  100% {
    opacity: 0;
    transform: scale(1.06);
  }
}

.final-area {
  position: relative;
}

.final-area .fact-card {
  z-index: 2;
}

.final-area--celebrate {
  overflow: visible;
}

.final-area--celebrate::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 48%;
  width: min(300px, 88vw);
  height: min(300px, 88vw);
  transform: translate(-50%, -50%) scale(0.4);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.5) 0%, rgba(99, 102, 241, 0.22) 45%, transparent 70%);
  animation: win-aura 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
}

@keyframes win-aura {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.35);
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.25);
  }
}

.win-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* Поверх финальной карточки; клики проходят к кнопкам */
  z-index: 20;
  overflow: hidden;
  border-radius: 22px;
}

.final-area--celebrate .backdrop-mood {
  z-index: 0;
}

.final-card-wrap {
  position: relative;
  z-index: 3;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.final-card-wrap--won {
  animation: win-wrap-pop 0.95s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes win-wrap-pop {
  0% {
    transform: scale(0.88);
    filter: saturate(0.92);
  }
  55% {
    transform: scale(1.06);
    filter: saturate(1.12);
  }
  100% {
    transform: scale(1);
    filter: saturate(1);
  }
}

.win-confetti {
  position: absolute;
  top: -18px;
  width: 10px;
  height: 14px;
  border-radius: 2px;
  opacity: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
  animation: win-confetti-fall 2s ease-out forwards;
}

@keyframes win-confetti-fall {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0.82;
    transform: translateY(500px) rotate(640deg) scale(0.72);
  }
}

.final-main-title {
  transition: color 0.3s ease;
}

.final-area--celebrate .final-main-title {
  background: linear-gradient(100deg, #059669 0%, #2563eb 45%, #7c3aed 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: win-title-reveal 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes win-title-reveal {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.96);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.final-card {
  min-height: 420px;
  width: min(100%, 300px);
}

.final-card.final-entering {
  will-change: transform;
}

.final-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.final-btn {
  height: 40px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.04);
}

.final-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.final-btn.primary {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
  box-shadow: 0 4px 12px rgba(79, 125, 255, 0.14);
}

.final-btn.primary:hover:not(:disabled) {
  background: #dbeafe;
}

.final-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.final-feedback {
  border-color: rgba(30, 64, 175, 0.2);
  color: #334155;
  background: rgba(241, 245, 249, 0.92);
}

@keyframes lab-breathe {
  0%,
  100% {
    box-shadow: 0 12px 30px rgba(2, 6, 23, 0.08);
  }
  50% {
    box-shadow: 0 14px 34px rgba(2, 6, 23, 0.12);
  }
}

@keyframes ambient-orb-a {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(8px, -6px);
  }
}

@keyframes ambient-orb-b {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-8px, 6px);
  }
}

@keyframes mood-sheen {
  0% {
    transform: translateX(-65%);
  }
  100% {
    transform: translateX(65%);
  }
}

@keyframes page-glow-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(1.5%, -1.5%, 0);
  }
}

@keyframes page-orb-drift {
  0%,
  100% {
    transform: translateY(-50%) translateX(0);
    opacity: 0.45;
  }
  50% {
    transform: translateY(-53%) translateX(6%);
    opacity: 0.62;
  }
}

@media (max-width: 1024px) {
  .swipe-page {
    padding: 12px;
  }

  .swipe-area {
    min-height: 480px;
  }

  .choice-feedback {
    width: min(100%, 290px);
    font-size: 11px;
    gap: 8px;
  }

  .micro-tip {
    font-size: 10px;
  }

  .main-text {
    font-size: 17px;
  }
}
</style>
