<script setup lang="ts">
import { getDistance } from 'geolib';
import type { YMapDefaultMarker } from '@yandex/ymaps3-types/packages/markers';
import { YandexMapDefaultMarker } from 'vue-yandex-maps';
import { defineComponent } from 'vue';
import type { PropType } from 'vue';

const defaultMarker = shallowRef<YMapDefaultMarker | null>(null);

/**
 * Пропсы для маркера
 */
interface MarkerProps {
  markerId: string | number
  /**
   * Координаты маркера
   */
  coords: {
    /**
     * Широта
     */
    lon: number
    /**
     * Долгота
     */
    lat: number
  }
  /**
   * Мои координаты
   */
  mi: {
      /**
     * Широта
     */
    lon: number
     /**
     * Долгота
     */
    lat: number
  }
  /**
   * название точки
   */
  name?: string
  /**
   * описание точки
   */
  description?: string
  /**
   * картинки точки
   */
  images?: string[]
}

const props = withDefaults(defineProps<MarkerProps>(), {
  name: '',
  description: '',
  images: () => []
})

const emit = defineEmits<{
  select: []
  popupOpen: [id: string | number]
  popupRegisterClose: [payload: { id: string | number, close: () => void }]
  popupClose: [id: string | number]
}>()

function is_range(def_range: number) {
  const range = getDistance(
    { lon: props.coords.lon, lat: props.coords.lat },
    { lon: props.mi.lon, lat: props.mi.lat }
  )
  return range <= def_range ? true : false
}

const currentImageIndex = ref(0)
const autoScrollInterval = ref<NodeJS.Timeout | null>(null)

onMounted(() => {
  startAutoScroll()
})

onUnmounted(() => {
  stopAutoScroll()
})

function startAutoScroll() {
  if (props.images.length > 1) {
    autoScrollInterval.value = setInterval(() => {
      currentImageIndex.value = (currentImageIndex.value + 1) % props.images.length
    }, 3000)
  }
}

function stopAutoScroll() {
  if (autoScrollInterval.value) {
    clearInterval(autoScrollInterval.value)
    autoScrollInterval.value = null
  }
}

const isHovered = ref(false)
const isDebugPopup = import.meta.dev
const PopupLifecycle = defineComponent({
  props: {
    markerId: {
      type: [String, Number],
      required: true
    },
    closeFn: {
      type: Function as PropType<() => void>,
      required: true
    }
  },
  emits: ['registerClose'],
  setup(lifecycleProps, { emit: lifecycleEmit }) {
    watch(() => lifecycleProps.closeFn, (closeFn) => {
      lifecycleEmit('registerClose', { id: lifecycleProps.markerId, close: lifecycleProps.closeFn })
    }, { immediate: true })

    return () => null
  }
})

function handlePopupRegisterClose(payload: { id: string | number, close: () => void }) {
  if (isDebugPopup) {
    console.log('[MapPopup][Marker] register close handler', { markerId: payload.id })
  }
  emit('popupRegisterClose', payload)
}

function handlePopupClose(close: () => void) {
  if (isDebugPopup) {
    console.log('[MapPopup][Marker] close button click', { markerId: props.markerId })
  }
  close()
  emit('popupClose', props.markerId)
}

function handleMarkerClick() {
  const marker = defaultMarker.value as any
  const isPopupOpen = Boolean(marker?._popupIsOpen)

  if (!isPopupOpen) {
    marker?._togglePopup?.()
  }

  if (Boolean(marker?._popupIsOpen)) {
    emit('popupOpen', props.markerId)
  }
}
</script>

<template >
  <yandex-map-default-marker
    
    v-model="defaultMarker"
    :settings="{
      coordinates: [props.coords.lat, props.coords.lon],
      popup: { position: 'top', hidesMarker: true },
      onClick: handleMarkerClick
    }"
  >
    <template #popup="{ close }">
      <PopupLifecycle
        :marker-id="props.markerId"
        :close-fn="close"
        @register-close="handlePopupRegisterClose"
      />
      <div 
        class="popup"
        @mouseenter="isHovered = true; stopAutoScroll()"
        @mouseleave="isHovered = false; startAutoScroll()"
      >
        <button class="close-button" @click="handlePopupClose(close)">&times;</button>
        
        <div v-if="props.images?.length" class="image-container">
          <transition-group name="fade">
            <img 
              v-for="(image, index) in props.images" 
              :key="index"
              :src="useCmsMedia(image)" 
              v-show="currentImageIndex === index"
              alt="Location image"
              class="location-image"
            >
          </transition-group>
          <div class="image-indicators">
            <div 
              v-for="(_, index) in props.images" 
              :key="index"
              :class="['indicator', { active: currentImageIndex === index }]"
            />
          </div>
        </div>

        <div class="content">
          <TwelveText v-if="props.name" class="title">{{ props.name }}</TwelveText>
          <TenText v-if="props.description" class="description">{{ props.description }}</TenText>
          
          <button 
            v-if="is_range(500)" 
            class="select-button"
            @click.stop="emit('select')"
          >
            Выбрать место
          </button>
        </div>
      </div>
    </template>
  </yandex-map-default-marker>

</template>

<style scoped>
.popup {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  width: 280px;
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.popup:hover {
  transform: translateY(-4px) rotateX(2deg);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.close-button {
  position: absolute;
  right: 8px;
  top: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 20px;
  cursor: pointer;
  z-index: 2;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  /* backdrop-filter: blur(4px); */
}

.close-button:hover {
  background: white;
  transform: scale(1.1);
}

.image-container {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.location-image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.location-image:hover {
  transform: scale(1.05);
}

.image-indicators {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 1;
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.indicator.active {
  background: white;
  transform: scale(1.2);
}

.content {
  padding: 16px;
  transform: translateZ(20px);
}

.title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  opacity: 0;
  animation: slideUp 0.5s ease forwards;
}

.description {
  margin: 0 0 16px;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  opacity: 0;
  animation: slideUp 0.5s ease 0.2s forwards;
}

.select-button {
  width: 100%;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  animation: slideUp 0.5s ease 0.4s forwards;
  transform-style: preserve-3d;
}

.select-button:hover {
  background: #1976D2;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.select-button:active {
  transform: translateY(0) scale(0.98);
}

/* Animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>