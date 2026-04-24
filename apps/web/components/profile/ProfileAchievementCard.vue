<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    /** documentId записи user-achievement; для «не выдано» не передаётся — см. locked */
    id: string
    title: string
    description: string
    collected: boolean
    /** Нет строки user-achievement — награда только в каталоге, забрать нельзя */
    locked?: boolean
  }>(),
  {
    locked: false,
  },
)

const emit = defineEmits<{
  collected: [userAchievementDocumentId: string]
}>()

const { update } = useStrapi()
const { pushUserNotification } = usePushUserNotification()
const isCollected = ref(props.collected)

/** Цвет карточки: собрано (жёлтое «золото») / можно забрать (сине-серебро) / не выдано (серебро) */
const surfaceClass = computed(() => {
  if (isCollected.value)
    return 'achievement-card--surface-collected'
  if (props.locked)
    return 'achievement-card--surface-locked'
  return 'achievement-card--surface-pending'
})
const isClaiming = ref(false)
const claimError = ref('')

watch(
  () => props.collected,
  (value) => {
    isCollected.value = value
    if (value)
      claimError.value = ''
  },
)

const collectAchievement = async () => {
  if (props.locked || isCollected.value || isClaiming.value)
    return

  isClaiming.value = true
  claimError.value = ''
  try {
    await update('user-achievements', props.id, { collected: true })
    isCollected.value = true
    emit('collected', props.id)
    const name = props.title.trim() || 'достижение'
    await pushUserNotification({
      text: `«${name}» — забрано в коллекцию.`,
      type: 'success',
      category: 'profile',
    })
  }
  catch {
    claimError.value = 'не вышло — попробуй ещё раз'
  }
  finally {
    isClaiming.value = false
  }
}
</script>

<template>
  <article
    class="achievement-card"
    :class="[surfaceClass]"
  >
    <h3 class="achievement-title">
      {{ title }}
    </h3>
    <p class="achievement-description">
      {{ description }}
    </p>

    <div
      v-if="!isCollected || isClaiming || claimError"
      class="achievement-footer"
    >
      <p v-if="claimError" class="achievement-error" role="alert">
        {{ claimError }}
      </p>
      <button
        v-if="!isCollected"
        type="button"
        class="achievement-action"
        :class="locked ? 'achievement-action--locked' : 'achievement-action--claim'"
        :disabled="locked || isClaiming"
        @click="collectAchievement"
      >
        <Loader2 v-if="isClaiming" class="achievement-action-spinner" :stroke-width="2" />
        <span v-if="isClaiming">секунду…</span>
        <span v-else-if="locked">не выдано</span>
        <span v-else>забрать!</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
.achievement-card {
  position: relative;
  height: 100%;
  min-height: clamp(172px, 38vw, 200px);
  border-radius: clamp(18px, 4.5vw, 26px);
  padding: clamp(12px, 2.8vw, 16px) clamp(12px, 2.6vw, 16px) clamp(12px, 2.4vw, 14px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: clamp(8px, 2vw, 10px);
  overflow: hidden;
  min-width: 0;
  border: 1px solid rgba(17, 17, 17, 0.06);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.45) inset,
    0 10px 28px rgba(17, 24, 39, 0.08);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease,
    filter 0.25s ease;
}

/* Собрано — тёплое золото (награда в коллекции) */
.achievement-card--surface-collected {
  background: linear-gradient(165deg, #f5e6a8 0%, #e8d078 42%, #d9be5e 100%);
  border-color: rgba(133, 100, 20, 0.28);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.55) inset,
    0 8px 22px rgba(161, 120, 30, 0.18);
}

.achievement-card--surface-collected .achievement-title {
  color: #4a3b10;
}

.achievement-card--surface-collected .achievement-description {
  color: rgba(74, 59, 16, 0.78);
}

/* Можно забрать — сине-серебро (акцент на действие) */
.achievement-card--surface-pending {
  background: linear-gradient(165deg, #e8f0ff 0%, #cfe0ff 44%, #b8cff8 100%);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.65) inset,
    0 10px 26px rgba(37, 99, 235, 0.16);
}

.achievement-card--surface-pending .achievement-title {
  color: #1e3a8a;
}

.achievement-card--surface-pending .achievement-description {
  color: rgba(30, 58, 138, 0.78);
}

/* Не выдано — холодное серебро */
.achievement-card--surface-locked {
  background: linear-gradient(165deg, #f0f2f5 0%, #e2e5eb 45%, #d4d8e0 100%);
  border-color: rgba(71, 85, 105, 0.18);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.75) inset,
    0 8px 20px rgba(51, 65, 85, 0.07);
}

.achievement-card--surface-locked .achievement-title {
  color: #475569;
}

.achievement-card--surface-locked .achievement-description {
  color: rgba(71, 85, 105, 0.78);
}

.achievement-title {
  margin: 0;
  width: 100%;
  max-width: 100%;
  color: #141414;
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(15px, 3.8vw, 18px);
  line-height: 1.12;
  text-transform: lowercase;
  overflow-wrap: anywhere;
  word-break: break-word;
  text-wrap: pretty;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.achievement-description {
  margin: 0;
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  color: rgba(30, 40, 42, 0.78);
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(11px, 3vw, 13px);
  line-height: 1.22;
  overflow-wrap: anywhere;
  word-break: break-word;
  text-wrap: pretty;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.achievement-action--locked {
  color: #6b6b70;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: none;
  cursor: default;
}

.achievement-footer {
  margin-top: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
}

.achievement-error {
  margin: 0;
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(10px, 2.6vw, 11px);
  line-height: 1.2;
  color: #b42318;
  text-align: center;
}

.achievement-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: clamp(36px, 9vw, 40px);
  padding: 0 12px;
  border: none;
  border-radius: clamp(12px, 3vw, 15px);
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(12px, 3.2vw, 14px);
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.12s ease,
    opacity 0.18s ease;
}

.achievement-action:disabled {
  cursor: default;
}

.achievement-action--claim {
  color: #ffffff;
  background: linear-gradient(180deg, #6b8ef7 0%, #4f74e8 100%);
  box-shadow: 0 4px 12px rgba(79, 116, 232, 0.35);
}

.achievement-action--claim:hover:not(:disabled) {
  background: linear-gradient(180deg, #5c82f0 0%, #4468dc 100%);
  transform: translateY(-1px);
}

.achievement-action--claim:active:not(:disabled) {
  transform: translateY(0);
}

.achievement-action-spinner {
  width: 16px;
  height: 16px;
  animation: achievement-spin 0.7s linear infinite;
}

@keyframes achievement-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 560px) {
  .achievement-card {
    min-height: clamp(168px, 44vw, 188px);
    border-radius: 20px;
    padding: 12px 10px 10px;
    gap: 7px;
  }

  .achievement-title {
    font-size: clamp(13px, 3.9vw, 16px);
  }

  .achievement-description {
    font-size: clamp(10px, 3vw, 12px);
    -webkit-line-clamp: 3;
  }

  .achievement-action {
    min-height: clamp(34px, 9vw, 38px);
    border-radius: 12px;
    font-size: clamp(11px, 3.2vw, 13px);
  }
}

@media (max-width: 390px) {
  .achievement-card {
    min-height: 162px;
    border-radius: 18px;
    padding: 10px 9px 9px;
  }

  .achievement-title {
    font-size: 12px;
  }

  .achievement-description {
    font-size: 10px;
    -webkit-line-clamp: 3;
  }

  .achievement-action {
    min-height: 32px;
    font-size: 11px;
  }
}
</style>
