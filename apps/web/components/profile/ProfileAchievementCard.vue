<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string
    title: string
    description: string
    collected: boolean
    variant?: 'sun' | 'mint'
  }>(),
  {
    variant: 'sun'
  }
)

const { update } = useStrapi()
const isCollected = ref(props.collected)

watch(
  () => props.collected,
  (value) => {
    isCollected.value = value
  }
)

const collectAchievement = async () => {
  if (isCollected.value) {
    return
  }

  await update('user-achievements', props.id, { collected: true })
  isCollected.value = true
}
</script>

<template>
  <article class="achievement-card" :class="`achievement-card--${variant}`">
    <h3 class="achievement-title">{{ title }}</h3>
    <p class="achievement-description">{{ description }}</p>

    <button
      type="button"
      class="achievement-action"
      :class="isCollected ? 'achievement-action--collected' : 'achievement-action--claim'"
      :disabled="isCollected"
      @click="collectAchievement"
    >
      {{ isCollected ? 'СОБРАНО' : 'забрать!' }}
    </button>
  </article>
</template>

<style scoped>
.achievement-card {
  min-height: clamp(184px, 24vw, 208px);
  aspect-ratio: 0.94;
  border-radius: 30px;
  padding: clamp(16px, 2vw, 18px) clamp(14px, 2vw, 16px) clamp(14px, 2vw, 16px);
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1.1vw, 8px);
  overflow: hidden;
  min-width: 0;
}

.achievement-card--sun {
  background-color: #e7d86f;
}

.achievement-card--mint {
  background-color: #8cc9ca;
}

.achievement-title {
  margin: 0;
  width: 100%;
  max-width: 100%;
  color: #111111;
  font-family: 'Gothic 60';
  font-size: clamp(17px, 2.1vw, 20px);
  line-height: 0.9;
  text-transform: uppercase;
  text-align: center;
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
  width: 100%;
  max-width: 100%;
  color: #5d6668;
  font-family: 'Gothic 60';
  font-size: clamp(13px, 1.5vw, 14px);
  line-height: 0.92;
  overflow-wrap: anywhere;
  word-break: break-word;
  text-wrap: pretty;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.achievement-action {
  margin-top: auto;
  height: clamp(38px, 4.5vw, 42px);
  border: none;
  border-radius: clamp(14px, 2vw, 16px);
  font-family: 'Gothic 60';
  font-size: clamp(14px, 1.8vw, 16px);
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.achievement-action:disabled {
  cursor: default;
}

.achievement-action--claim {
  color: #ffffff;
  background-color: #5d86f5;
}

.achievement-action--collected {
  color: #7d7d7d;
  background-color: #f1f1f1;
}

@media (max-width: 560px) {
  .achievement-card {
    min-height: clamp(172px, 50vw, 184px);
    aspect-ratio: 0.98;
    border-radius: 24px;
    padding: 14px 12px 12px;
    gap: 6px;
  }

  .achievement-title {
    font-size: clamp(14px, 4.1vw, 17px);
    line-height: 0.88;
  }

  .achievement-description {
    font-size: clamp(11px, 3.2vw, 13px);
    line-height: 0.9;
  }

  .achievement-action {
    height: clamp(34px, 9vw, 38px);
    border-radius: 13px;
    font-size: clamp(12px, 3.5vw, 14px);
  }
}

@media (max-width: 390px) {
  .achievement-card {
    min-height: 164px;
    border-radius: 20px;
    padding: 12px 10px 10px;
  }

  .achievement-title {
    font-size: 13px;
    line-height: 0.86;
  }

  .achievement-description {
    font-size: 10px;
    -webkit-line-clamp: 3;
  }

  .achievement-action {
    height: 32px;
    border-radius: 12px;
    font-size: 11px;
  }
}
</style>
