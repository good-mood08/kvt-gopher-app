<script setup lang="ts">
import { shallowRef, ref, onMounted } from 'vue';
import { useIntervalFn } from '@vueuse/core';

import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultMarker,
} from 'vue-yandex-maps';
import type { YMapDefaultMarker } from '@yandex/ymaps3-types/packages/markers';

interface Point {
  lat: number
  lon: number
  name?: string
  description?: string
  documentId?: string
  images?: Array<{ url: string }>
}

interface MapData {
  locations: Point[]
}

const props = withDefaults(defineProps<{
  /**
   * точки
   */
  points: MapData
  /**
   * режим координат:
   * auto - мобильный фикс / десктоп гео
   * fixed - всегда фиксированные координаты
   * geo - всегда пробовать геолокацию
   */
  coordsMode?: 'auto' | 'fixed' | 'geo'
}>(), {
  coordsMode: 'geo'
});

const defaultMarker = shallowRef<YMapDefaultMarker | null>(null);
const currentImageIndex = ref(0);
const isPopupVisible = ref(false);
const popupOpacity = ref(0);
const fallbackCoordinates: [number, number] = [44.746292, 48.797957]
const center_map = ref<[number, number]>([...fallbackCoordinates])
const userCoordinates = ref<[number, number]>([...fallbackCoordinates])
const isUsingGeo = ref(false)
const activePopupId = ref<string | number | null>(null)
const popupClosers = new Map<string | number, () => void>()
const isDebugPopup = import.meta.dev
const router = useRouter()

const onDragMove = () => {
  triggerRef(defaultMarker);
};

const showPopup = () => {
  isPopupVisible.value = true;
  setTimeout(() => {
    popupOpacity.value = 1;
  }, 50);
};

const hidePopup = () => {
  popupOpacity.value = 0;
  setTimeout(() => {
    isPopupVisible.value = false;
  }, 300);
};

function handlePopupRegisterClose(payload: { id: string | number, close: () => void }) {
  popupClosers.set(payload.id, payload.close)
  if (isDebugPopup) {
    console.log('[MapPopup][Map] registered close handler', { id: payload.id })
  }
}

function handlePopupOpen(id: string | number) {
  const prevId = activePopupId.value
  const prevClose = prevId !== null ? popupClosers.get(prevId) ?? null : null
  if (isDebugPopup) {
    console.log('[MapPopup][Map] popupOpen received', {
      nextId: id,
      prevId,
      hasPrevClose: Boolean(prevClose)
    })
  }

  activePopupId.value = id
  if (isDebugPopup) {
    console.log('[MapPopup][Map] active popup switched', { activeId: activePopupId.value })
  }

  if (prevId !== id && prevClose) {
    if (isDebugPopup) {
      console.log('[MapPopup][Map] closing previous popup', {
        closingId: prevId,
        nextId: id
      })
    }
    prevClose()
  }
}

function handlePopupClose(id: string | number) {
  if (isDebugPopup) {
    console.log('[MapPopup][Map] popupClose received', {
      id,
      activeId: activePopupId.value
    })
  }
  if (activePopupId.value !== id) {
    if (isDebugPopup) {
      console.log('[MapPopup][Map] ignore popupClose for inactive marker', { id })
    }
    return
  }

  activePopupId.value = null
  if (isDebugPopup) {
    console.log('[MapPopup][Map] active popup reset')
  }
}

// Auto-scroll images
useIntervalFn(() => {
  if (props.points.locations.length > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % 2;
  }
}, 3000);

const applyCoordinatesMode = () => {
  const isMobileViewport = window.matchMedia('(max-width: 768px)').matches
  const forceFixedCoords = props.coordsMode === 'fixed'
  const forceGeoCoords = props.coordsMode === 'geo'
  const shouldUseFixed = (isMobileViewport && !forceGeoCoords) || forceFixedCoords

  if (shouldUseFixed || !navigator.geolocation) {
    isUsingGeo.value = false
    userCoordinates.value = [...fallbackCoordinates]
    center_map.value = [...fallbackCoordinates]
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords: [number, number] = [
        position.coords.longitude,
        position.coords.latitude
      ]
      isUsingGeo.value = true
      userCoordinates.value = coords
      center_map.value = coords
    },
    () => {
      isUsingGeo.value = false
      userCoordinates.value = [...fallbackCoordinates]
      center_map.value = [...fallbackCoordinates]
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  )
}

onMounted(() => {
  showPopup();
  applyCoordinatesMode()
});

watch(
  () => props.coordsMode,
  () => {
    applyCoordinatesMode()
  }
)
function url(point: Point) {

if (!point.images) {
  return []
}
 const urls = point.images.map(item => item.url)
 
 
 return urls
}

async function handleSelectPoint(point: Point) {
  if (!point.documentId) {
    return
  }

  await router.push(`/locationStory/${point.documentId}`)
}
</script>

<template>
  <yandex-map
    :settings="{
      location: {
        center: center_map,
        zoom: 15,
      },
    }"
    width="100%"
    height="100%"
    class="map-container"
  >
    <yandex-map-default-scheme-layer />
    <yandex-map-default-features-layer />

    <yandex-map-default-marker
      v-model="defaultMarker"
      :settings="{
        coordinates: userCoordinates,
        title: `Долгота: ${defaultMarker?.coordinates[0].toFixed(2)}<br>Широта: ${defaultMarker?.coordinates[1].toFixed(2)}`,
        draggable: !isUsingGeo,
        onDragMove,
        onClick(event, mapEvent) {
          console.log(defaultMarker?.coordinates);
        },
        color: 'green',

      }"
    />

    <Marcer 
      v-for="point in props.points.locations"
      :marker-id="point.documentId ?? `${point.lat}-${point.lon}`"
      :coords="{
        lon: +point.lon,
        lat: +point.lat
      }"
      :mi="{
        lon: +defaultMarker?.coordinates[1]!,
        lat: +defaultMarker?.coordinates[0]!
      }"
      :images="url(point)  "
      :current-image="currentImageIndex"
      :name="point.name"
      :description="point.description"
      
      
      @mouseenter="() => {
        
        
        showPopup()
        
        

       } "
      @mouseleave="hidePopup"
      @popup-register-close="handlePopupRegisterClose"
      @popup-open="handlePopupOpen"
      @popup-close="handlePopupClose"
      @select="handleSelectPoint(point)"
    />
  </yandex-map>
</template>

<style scoped>
.map-container {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.marker-popup {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform-origin: center bottom;
  animation: bounce 0.5s ease;
}

.marker {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  color: #fff;
  padding: 12px 24px;
  white-space: nowrap;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.marker:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.popup {
  position: absolute;
  top: calc(100% + 15px);
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  color: #333;
  opacity: 1;
  transform: translateY(0);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@keyframes bounce {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>