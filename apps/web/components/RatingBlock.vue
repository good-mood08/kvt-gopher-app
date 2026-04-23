<script setup lang="ts">
type RatingBlockProps = {
  place: number
  name: string
  percent: number
  isCurrentUser?: boolean
}

const props = withDefaults(defineProps<RatingBlockProps>(), {
  isCurrentUser: false,
})

const safePercent = computed(() => {
  const value = Number.isFinite(props.percent) ? props.percent : 0
  return Math.min(100, Math.max(0, Math.round(value)))
})
</script>

<template>
  <div class="rate-block-body" :class="{ blue: props.isCurrentUser }">
    <div class="name-area">
      <span class="place-badge">{{ props.place }}</span>
      <div class="meta">
        <TwentyText class="player-name">{{ props.name }}</TwentyText>
        <span v-if="props.isCurrentUser" class="self-chip">вы</span>
      </div>
    </div>
    <div class="progress-area">
      <TwentyText class="percent">{{ safePercent }}%</TwentyText>
      <div class="progress-track" role="presentation">
        <span class="progress-fill" :style="{ width: `${safePercent}%` }" />
      </div>
    </div>
  </div>
</template>
<style scoped>


.rate-block-body{
    width: 100%;
    min-height: 72px;
    padding: 14px 14px 12px;
    background-color: #F4F5F7;
    border-radius: 16px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border: 1px solid #e5e7eb;
}

.name-area{
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    min-width: 0;
    max-width: calc(100% - 128px);
}

.place-badge {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  background: #ffffff;
  border: 1px solid #d1d5db;
  flex-shrink: 0;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.player-name {
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.self-chip {
  font-size: 11px;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 4px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.progress-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  width: 120px;
  flex-shrink: 0;
}

.percent {
  font-size: 18px !important;
  line-height: 1;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: rgba(17, 24, 39, 0.12);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  display: block;
  height: 100%;
  background: #4f46e5;
  border-radius: 999px;
}

.blue{
    background-color: #477DFF;
    color: #FFFFFF;
    border-color: #477DFF;
}

.blue .place-badge {
  color: #1f3f9c;
  border-color: rgba(255, 255, 255, 0.85);
}

.blue .progress-track {
  background: rgba(255, 255, 255, 0.25);
}

.blue .progress-fill {
  background: #ffffff;
}

@media (max-width: 480px) {
  .rate-block-body {
    min-height: 68px;
    padding: 12px;
  }

  .progress-area {
    width: 94px;
  }

  .name-area {
    max-width: calc(100% - 102px);
  }
}

</style>