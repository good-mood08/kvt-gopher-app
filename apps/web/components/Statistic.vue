<script setup lang="ts">
defineProps<{
  title: string | number
  description: string
}>()
</script>

<template>
  <div class="statistic-row" role="listitem">
    <span class="statistic-value">{{ title }}</span>
    <span class="statistic-label">{{ description }}</span>
  </div>
</template>

<style scoped>
.statistic-row {
  display: grid;
  grid-template-columns: minmax(2.75rem, auto) minmax(0, 1fr);
  align-items: center;
  column-gap: clamp(12px, 3.5vw, 18px);
  padding: clamp(13px, 3.2vw, 16px) clamp(14px, 3.6vw, 18px);
  min-width: 0;
  box-sizing: border-box;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset;
}

.statistic-row:nth-child(even) {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(0, 0, 0, 0.04);
}

.statistic-value {
  margin: 0;
  text-align: left;
  color: #111111;
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(22px, 5.2vw, 28px);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.statistic-label {
  margin: 0;
  min-width: 0;
  color: #4a4a4f;
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(12px, 3.1vw, 14px);
  line-height: 1.22;
  text-align: left;
  word-break: normal;
  overflow-wrap: break-word;
  hyphens: none;
  text-wrap: balance;
}

@media (max-width: 380px) {
  .statistic-row {
    column-gap: 10px;
    padding: 12px 12px;
    border-radius: 16px;
  }

  .statistic-value {
    font-size: clamp(20px, 5vw, 24px);
  }

  .statistic-label {
    font-size: 11px;
  }
}
</style>
