<script setup lang="ts">
import { getDistance } from 'geolib';
import { YandexMapDefaultMarker } from 'vue-yandex-maps';

const defaultMarker = shallowRef<any | null>(null);

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
  completed?: boolean
  popupOpen?: boolean
}

const props = withDefaults(defineProps<MarkerProps>(), {
  name: '',
  description: '',
  images: () => [],
  completed: false,
  popupOpen: false,
})

const emit = defineEmits<{
  select: []
  markerClick: [id: string | number]
  popupOpen: [id: string | number]
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
function handleMarkerClick() {
  console.info('[MapPopup][Marker] click', { markerId: props.markerId, popupOpen: props.popupOpen })
  emit('markerClick', props.markerId)
}

function handlePopupClose() {
  console.info('[MapPopup][Marker] close button click', { markerId: props.markerId })
  emit('popupClose', props.markerId)
}

const markerColor = computed(() => (props.completed ? 'green' : 'blue'))
const markerIconName = computed(() => (props.completed ? 'checkpoint' : 'landmark'))
const markerSettings = computed(() => ({
  coordinates: [props.coords.lat, props.coords.lon],
  onClick: handleMarkerClick,
  popup: {
    position: 'top',
    hidesMarker: true,
    show: props.popupOpen,
    onOpen: () => {
      console.info('[MapPopup][Marker] popup onOpen', { markerId: props.markerId })
      emit('popupOpen', props.markerId)
    },
    onClose: () => {
      console.info('[MapPopup][Marker] popup onClose', { markerId: props.markerId })
      emit('popupClose', props.markerId)
    },
  },
  color: markerColor.value,
  iconName: markerIconName.value,
  size: 'normal',
  title: props.completed ? 'пройдена' : 'пройти',
  subtitle: props.name || '',
}) as any)
</script>

<template >
  <yandex-map-default-marker
    
    v-model="defaultMarker"
    :settings="markerSettings"
  >
    <template #popup>
      <div 
        class="popup"
        @mouseenter="isHovered = true; stopAutoScroll()"
        @mouseleave="isHovered = false; startAutoScroll()"
      >
        <button class="close-button" @click="handlePopupClose">&times;</button>
        
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
            v-if="is_range(250)" 
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
  width: 240px;
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
  width: 24px;
  height: 24px;
  font-size: 18px;
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
  height: 150px;
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
  padding: 12px;
  transform: translateZ(20px);
}

.title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  opacity: 0;
  animation: slideUp 0.5s ease forwards;
}

.description {
  margin: 0 0 16px;
  font-size: 13px;
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
  padding: 9px 14px;
  font-size: 13px;
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