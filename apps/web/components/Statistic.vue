<script setup lang="ts">
defineProps<{
  /**
   * цифра для статистики
   */
  title: string | number
  /**
   * описание для статистики
   */
  description: string
}>()
</script>

<template>
  <div class="statistic-block">
    <p class="statistic-number">{{ title }}</p>
    <p class="statistic-description">{{ description }}</p>
  </div>
</template>

<style scoped>
.statistic-block{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  min-height: 142px;
  aspect-ratio: 0.88;
  width: 100%;
  padding: 16px 12px;
  border-radius: 24px;
  background-color: #ECECEC;
  overflow: hidden;
  min-width: 0;
}

.statistic-number{
  margin: 0;
  color: #111111;
  font-family: 'Gothic 60';
  font-size: 40px;
  line-height: 0.84;
}

.statistic-description{
  margin: 0;
  width: 100%;
  max-width: 100%;
  padding: 0 2px;
  color: #1e1e1e;
  text-align: center;
  font-family: 'Gothic 60';
  font-size: 9px;
  line-height: 1.05;
  overflow-wrap: anywhere;
  word-break: break-word;
  text-wrap: pretty;
}

@media (max-width: 900px) {
  .statistic-block{
    min-height: 126px;
    border-radius: 20px;
  }

  .statistic-description{
    font-size: 9px;
  }
}

@media (max-width: 560px) {
  .statistic-block{
    min-height: 108px;
    gap: 8px;
    padding: 14px 10px;
    border-radius: 16px;
  }

  .statistic-number{
    font-size: 40px;
  }

  .statistic-description{
    font-size: 9px;
    line-height: 1;
  }
}
</style>
