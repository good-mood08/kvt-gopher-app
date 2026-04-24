<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ProgressIndicator, ProgressRoot } from 'radix-vue'

function clampProgress(p: unknown): number {
  const n = Number(p)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

const props = defineProps<{
  /** прогресс по карте, 0–100 */
  progress: number
}>()

const progressValue = ref(clampProgress(props.progress))

watch(
  () => props.progress,
  (p) => {
    progressValue.value = clampProgress(p)
  },
)

onMounted(() => {
  const timer = setTimeout(() => {
    progressValue.value = clampProgress(props.progress)
  }, 500)
  return () => clearTimeout(timer)
})
</script>

<template>
  <ProgressRoot
    v-model="progressValue"
    class="ProgressRoot"
    style="transform: translateZ(0)"
  >
    <ProgressIndicator
      class="ProgressIndicator"
      :style="`transform: translateX(-${100 - clampProgress(progressValue)}%)`"
    />
  </ProgressRoot>
</template>


<style scoped>


.ProgressRoot {
  position: relative;
  overflow: hidden;
  background: rgba(242, 242, 242, 1);
  border-radius: 50px;
  width: 100%;
  height: 25px;
  transform: translateZ(0);
}

.ProgressIndicator {
  background-color: rgba(79, 125, 255, 1);
  width: 100%;
  height: 100%;
  border-radius: 50px;
  transition: transform 900ms cubic-bezier(0.65, 0, 0.35, 1);
}
</style>