<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

type RatingBlockProps = {
  place: number
  name: string
  percent: number
  isCurrentUser?: boolean
  suslikUrl: string
  exp: number
  completedCount: number
  totalLocations: number
}

const props = withDefaults(defineProps<RatingBlockProps>(), {
  isCurrentUser: false,
})

const expanded = ref(false)

const safePercent = computed(() => {
  const value = Number.isFinite(props.percent) ? props.percent : 0
  return Math.min(100, Math.max(0, Math.round(value)))
})

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div
    class="rate-wrap"
    :class="{ 'rate-wrap--open': expanded, 'rate-wrap--self': props.isCurrentUser }"
  >
    <button
      type="button"
      class="rate-block-body"
      :class="{ blue: props.isCurrentUser, 'rate-block-body--open': expanded }"
      :aria-expanded="expanded"
      :aria-label="expanded ? `Свернуть: ${props.name}` : `Подробнее: ${props.name}`"
      @click="toggle"
    >
      <div class="name-area">
        <span class="place-badge">{{ props.place }}</span>
        <div class="avatar-thumb" aria-hidden="true">
          <img :src="props.suslikUrl" alt="" class="avatar-thumb-img">
        </div>
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
        <ChevronDown class="chevron" :class="{ 'chevron--up': expanded }" :stroke-width="2" aria-hidden="true" />
      </div>
    </button>

    <div v-show="expanded" class="rate-details">
      <div class="rate-details-visual">
        <img
          :src="props.suslikUrl"
          class="rate-details-suslik"
          :alt="`Суслик игрока ${props.name}`"
        >
      </div>
      <dl class="rate-details-list">
        <div class="rate-details-row">
          <dt>ник</dt>
          <dd>{{ props.name }}</dd>
        </div>
        <div class="rate-details-row">
          <dt>EXP</dt>
          <dd>{{ props.exp }}</dd>
        </div>
        <div class="rate-details-row">
          <dt>локации в городе</dt>
          <dd>{{ props.completedCount }} / {{ props.totalLocations }}</dd>
        </div>
        <div class="rate-details-row">
          <dt>прогресс</dt>
          <dd>{{ safePercent }}%</dd>
        </div>
        <div class="rate-details-row">
          <dt>место</dt>
          <dd>{{ props.place }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.rate-wrap {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f4f5f7;
}

.rate-wrap--self {
  background: #477dff;
  border-color: #477dff;
  color: #fff;
}

.rate-wrap--open {
  border-color: #c7cad1;
}

.rate-wrap--self.rate-wrap--open {
  border-color: #3a66d6;
}

.rate-block-body {
  width: 100%;
  min-height: 72px;
  padding: 14px 14px 12px;
  margin: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font: inherit;
}

.rate-block-body:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.name-area {
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

.avatar-thumb {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  background: #e5e7eb;
  flex-shrink: 0;
  border: 1px solid #d1d5db;
}

.avatar-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  display: block;
  transform: scale(1.08);
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
  gap: 4px;
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

.chevron {
  width: 18px;
  height: 18px;
  color: #6b7280;
  margin-top: 2px;
  transition: transform 0.2s ease;
}

.chevron--up {
  transform: rotate(180deg);
}

.rate-details {
  padding: 0 14px 14px;
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  background: #f8f9fb;
  display: flex;
  flex-direction: row;
  gap: 14px;
  align-items: stretch;
}

.rate-details-visual {
  flex-shrink: 0;
  width: 112px;
  min-height: 120px;
  border-radius: 14px;
  background: linear-gradient(180deg, #eef0f4 0%, #e2e5ea 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #d1d5db;
}

.rate-details-suslik {
  width: 88%;
  height: auto;
  max-height: 140px;
  object-fit: contain;
  object-position: bottom center;
  display: block;
}

.rate-details-list {
  margin: 0;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0 4px;
}

.rate-details-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: baseline;
  font-size: 13px;
  line-height: 1.35;
}

.rate-details-row dt {
  margin: 0;
  color: #6b7280;
  font-weight: 500;
}

.rate-details-row dd {
  margin: 0;
  font-weight: 600;
  color: #111827;
  text-align: right;
}

.blue {
  background-color: #477dff;
  color: #ffffff;
}

.blue.rate-block-body {
  background-color: #477dff;
}

.blue .place-badge {
  color: #1f3f9c;
  border-color: rgba(255, 255, 255, 0.85);
}

.blue .avatar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.45);
}

.blue .progress-track {
  background: rgba(255, 255, 255, 0.25);
}

.blue .progress-fill {
  background: #ffffff;
}

.blue .chevron {
  color: rgba(255, 255, 255, 0.9);
}

.rate-wrap--self .rate-details {
  background: #477dff;
  color: #fff;
  border-top-color: rgba(255, 255, 255, 0.2);
}

.rate-wrap--self .rate-details-row dt {
  color: rgba(255, 255, 255, 0.75);
}

.rate-wrap--self .rate-details-row dd {
  color: #fff;
}

.rate-wrap--self .rate-details-visual {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%);
  border-color: rgba(255, 255, 255, 0.35);
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

  .avatar-thumb {
    width: 36px;
    height: 36px;
  }

  .rate-details {
    flex-direction: column;
    align-items: center;
  }

  .rate-details-visual {
    width: 100%;
    max-width: 200px;
    min-height: 100px;
  }

  .rate-details-list {
    width: 100%;
    padding-top: 4px;
  }
}
</style>
