<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string
    title: string
    description?: string | null
    percent: number
    /** обложка карты из Strapi (`map.image`) */
    coverUrl?: string
  }>(),
  { description: '', coverUrl: '' },
)

const visualStyle = computed(() => {
  const u = (props.coverUrl ?? '').trim()
  if (!u) return {}
  return { backgroundImage: `url(${JSON.stringify(u)})` }
})
</script>
<template>
    <Block class="plot-area-card">
        <div class="plot-name-area">
            <h3 class="plot-title">{{ title }}</h3>
            <div class="plot-percent">{{ percent }}%</div>
        </div>

        <div class="plot-visual" :style="visualStyle">
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
    width: min(340px, 100%);
    max-width: 100%;
    min-height: clamp(220px, 70vw, 280px);
    gap: clamp(10px, 2.8vw, 14px);
    border-radius: clamp(14px, 4.8vw, 20px);
    padding: clamp(10px, 3.8vw, 14px);
    background-color: #E9E9E9;
    box-sizing: border-box;
}

.plot-visual {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 10;
    height: auto;
    border-radius: clamp(10px, 3.6vw, 14px);
    overflow: hidden;
    padding: clamp(9px, 3vw, 12px);
    background-image: url('/images/Frame 182.svg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    flex-shrink: 0;
}

@supports not (aspect-ratio: 1) {
    .plot-visual {
        height: clamp(140px, 52vw, 200px);
    }
}

.plot-name-area {
    display: flex;
    flex-direction: column;
    gap: clamp(6px, 1.8vw, 10px);
    width: 100%;
    flex-shrink: 0;
}

.plot-title {
    margin: 0;
    font-family: 'Gothic 60';
    color: #090909;
    font-size: clamp(15px, 4.6vw, 18px);
    line-height: 1;
}

.plot-description {
    margin: 0;
    font-family: 'Gothic 60';
    color: #6f6f6f;
    font-size: clamp(10px, 2.8vw, 11px);
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
    min-width: clamp(50px, 14vw, 58px);
    padding: clamp(5px, 1.6vw, 6px) clamp(10px, 3.2vw, 12px);
    border-radius: clamp(10px, 3vw, 12px);
    background-color: #f6f6f6;
    color: #7a7a7a;
    font-family: 'Gothic 60';
    font-size: clamp(12px, 3.6vw, 14px);
    line-height: 1;
}

:deep(.plot-cta) {
    position: absolute;
    right: clamp(8px, 2.8vw, 12px);
    bottom: clamp(4px, 1.4vw, 6px);
    border-radius: clamp(10px, 3vw, 12px);
    padding: clamp(6px, 2vw, 8px) clamp(14px, 4.8vw, 18px);
    background-color: #477dff;
    box-shadow: 0 6px 14px rgba(71, 125, 255, 0.30);
}

:deep(.plot-cta .button-action-text) {
    color: #ffffff;
    font-size: clamp(13px, 3.9vw, 15px);
    line-height: 1;
}

@media (max-width: 360px) {
    .plot-area-card {
        min-height: 58vw;
        width: min(82vw, 100%);
        padding: 2.5vw;
        gap: 2.2vw;
    }

    .plot-visual {
        aspect-ratio: 16 / 10;
        height: auto;
        padding: 2.2vw;
    }

    .plot-title {
        font-size: 3.9vw;
    }

    .plot-description {
        font-size: 2.8vw;
    }

    .plot-percent {
        min-width: 12.2vw;
        font-size: 3.1vw;
        padding: 1.1vw 2.2vw;
    }

    :deep(.plot-cta .button-action-text) {
        font-size: 3.3vw;
    }
}
</style>
