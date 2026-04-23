<script setup lang="ts">
defineProps<{

    /**
     * id записи карты в базе данных
     */
  id: string
    /**
     * называние карты
     */
  title: string
    /**
     * описание карты
     */
  description: string
    /**
     * процент прохождения по карте
     */
  percent: number
}>()
</script>
<template>
    <Block class="plot-area-card">
        <div class="plot-visual">
            <div class="plot-name-area">
                <h3 class="plot-title">{{ title }}.<br>волжский</h3>
                <div class="plot-percent">{{ percent }}%</div>
            </div>

            <ButtonAction class="plot-cta" @click="async() => {await navigateTo(`map/${id}`)}">вперёд!</ButtonAction>
        </div>

        <p class="plot-description">{{ description }}</p>
    </Block>
</template>
<style scoped>
.plot-area-card {
    isolation: isolate;
    display: flex;
    flex-direction: column;
    width: min(320px, 100%);
    max-width: 100%;
    height: 300px;
    gap: 14px;
    border-radius: 20px;
    padding: 14px;
    background-color: #E9E9E9;
    box-sizing: border-box;
}

.plot-visual {
    position: relative;
    width: 100%;
    height: 196px;
    border-radius: 14px;
    overflow: hidden;
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-image: url('/images/Frame 182.svg');
    background-size: cover;
    background-position: center;
    flex-shrink: 0;
}

.plot-name-area {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 65%;
}

.plot-title {
    margin: 0;
    font-family: 'Gothic 60';
    color: #090909;
    font-size: 20px;
    line-height: 1;
}

.plot-description {
    margin: 0;
    font-family: 'Gothic 60';
    color: #6f6f6f;
    font-size: 12px;
    line-height: 1.02;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.plot-percent {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    min-width: 58px;
    padding: 6px 12px;
    border-radius: 12px;
    background-color: #f6f6f6;
    color: #7a7a7a;
    font-family: 'Gothic 60';
    font-size: 16px;
    line-height: 1;
}

:deep(.plot-cta) {
    position: absolute;
    right: 12px;
    bottom: 12px;
    border-radius: 12px;
    padding: 8px 18px;
    background-color: #477dff;
    box-shadow: 0 6px 14px rgba(71, 125, 255, 0.30);
}

:deep(.plot-cta .button-action-text) {
    color: #ffffff;
    font-size: 16px;
    line-height: 1;
}

@media (max-width: 768px) {
    .plot-area-card {
        width: min(304px, 100%);
        height: 286px;
        gap: 12px;
        border-radius: 18px;
        padding: 12px;
    }

    .plot-visual {
        height: 182px;
        border-radius: 12px;
        padding: 10px;
    }

    .plot-title {
        font-size: 18px;
    }

    .plot-description {
        font-size: 11px;
    }

    .plot-percent {
        min-width: 54px;
        padding: 5px 11px;
        font-size: 15px;
    }

    :deep(.plot-cta) {
        right: 10px;
        bottom: 10px;
        padding: 7px 16px;
    }

    :deep(.plot-cta .button-action-text) {
        font-size: 15px;
    }
}
</style>
