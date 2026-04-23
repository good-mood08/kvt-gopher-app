<script setup lang="ts">
import { shallowRef, ref, onMounted, nextTick } from 'vue';
import { useIntervalFn } from '@vueuse/core';

import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultMarker,
  YandexMapFeature,
} from 'vue-yandex-maps';

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
  completedLocationIds?: string[]
  /**
   * режим координат:
   * auto - мобильный фикс / десктоп гео
   * fixed - всегда фиксированные координаты
   * geo - всегда пробовать геолокацию
   */
  coordsMode?: 'auto' | 'fixed' | 'geo'
}>(), {
  coordsMode: 'geo',
  completedLocationIds: () => []
});

const defaultMarker = shallowRef<any | null>(null);
const currentImageIndex = ref(0);
const isPopupVisible = ref(false);
const popupOpacity = ref(0);
const fallbackCoordinates: [number, number] = [44.746292, 48.797957]
const center_map = ref<[number, number]>([...fallbackCoordinates])
const userCoordinates = ref<[number, number]>([...fallbackCoordinates])
const isUsingGeo = ref(false)
const activePopupId = ref<string | number | null>(null)
const isMapReady = ref(false)
const router = useRouter()
const completedLocationIdsSet = computed(() => new Set(props.completedLocationIds))
const ACCESS_RADIUS_METERS = 250
const radiusPulseProgress = ref(0)
const distanceCheckCoords = computed(() => {
  // Keep compatibility with marker range check (legacy lon/lat mapping),
  // but always derive from current userCoordinates so mode switches are synced.
  return {
    lon: Number(userCoordinates.value[1]),
    lat: Number(userCoordinates.value[0]),
  }
})
const rangeCenterCoordinates = computed<[number, number]>(() => ([
  // distanceCheckCoords keeps legacy lon/lat mapping for range checks.
  // Convert it back to map [lng, lat] coordinates for feature rendering.
  distanceCheckCoords.value.lat,
  distanceCheckCoords.value.lon,
]))

function syncUserCoordinatesFromMarker() {
  const markerCoords = defaultMarker.value?.coordinates
  if (!Array.isArray(markerCoords) || markerCoords.length < 2) return

  userCoordinates.value = [Number(markerCoords[0]), Number(markerCoords[1])]
}

function buildCirclePolygon(center: [number, number], radiusMeters: number, points = 64): [number, number][] {
  const [lon, lat] = center
  const earthRadiusMeters = 6378137
  const latRad = (lat * Math.PI) / 180
  const angularDistance = radiusMeters / earthRadiusMeters
  const ring: [number, number][] = []

  for (let i = 0; i <= points; i++) {
    const angle = (2 * Math.PI * i) / points
    const latOffset = ((angularDistance * Math.sin(angle)) * 180) / Math.PI
    const lonOffset = ((angularDistance * Math.cos(angle)) * 180) / Math.PI / Math.max(Math.cos(latRad), 0.00001)
    ring.push([lon + lonOffset, lat + latOffset])
  }

  return ring
}

const userAccessRadiusFeatureSettings = computed(() => ({
  geometry: {
    type: 'Polygon',
    coordinates: [buildCirclePolygon(rangeCenterCoordinates.value, ACCESS_RADIUS_METERS)],
  },
  style: {
    zIndex: 900,
    fill: '#60a5fa',
    fillOpacity: 0.12,
    stroke: [{ color: '#93c5fd', width: 1.6, opacity: 0.48 }],
  },
}) as any)
const userAccessWaveOneFeatureSettings = computed(() => {
  const radius = ACCESS_RADIUS_METERS * (0.42 + radiusPulseProgress.value * 0.58)
  const opacity = 0.06 + 0.4 * Math.pow(1 - radiusPulseProgress.value, 1.35)

  return {
    geometry: {
      type: 'Polygon',
      coordinates: [buildCirclePolygon(rangeCenterCoordinates.value, radius)],
    },
    style: {
      zIndex: 901,
      stroke: [{ color: '#93c5fd', width: 1.75, opacity }],
      fill: '#93c5fd',
      fillOpacity: 0,
    },
  } as any
})
const userAccessWaveTwoFeatureSettings = computed(() => {
  const shiftedProgress = (radiusPulseProgress.value + 0.5) % 1
  const radius = ACCESS_RADIUS_METERS * (0.42 + shiftedProgress * 0.58)
  const opacity = 0.06 + 0.4 * Math.pow(1 - shiftedProgress, 1.35)

  return {
    geometry: {
      type: 'Polygon',
      coordinates: [buildCirclePolygon(rangeCenterCoordinates.value, radius)],
    },
    style: {
      zIndex: 901,
      stroke: [{ color: '#bfdbfe', width: 1.75, opacity }],
      fill: '#bfdbfe',
      fillOpacity: 0,
    },
  } as any
})

const userMarkerSettings = computed(() => ({
  coordinates: userCoordinates.value,
  title: isUsingGeo.value ? undefined : 'Вы здесь',
  subtitle: isUsingGeo.value ? undefined : 'Фиксированная точка',
  draggable: !isUsingGeo.value,
  onDragMove,
  onDragEnd,
  color: 'red',
  iconName: 'pedestrian',
  size: isUsingGeo.value ? 'small' : 'normal',
  staticHint: !isUsingGeo.value,
}) as any)

const onDragMove = () => {
  syncUserCoordinatesFromMarker()
  triggerRef(defaultMarker);
};

const onDragEnd = () => {
  syncUserCoordinatesFromMarker()
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

function handleMarkerClick(id: string | number) {
  const nextValue = activePopupId.value === id ? null : id
  console.info('[MapPopup][Map] marker click', { id, prevId: activePopupId.value, nextId: nextValue })
  activePopupId.value = nextValue
}

function handlePopupOpen(id: string | number) {
  console.info('[MapPopup][Map] popup open', { id })
  activePopupId.value = id
}

function handlePopupClose(id: string | number) {
  console.info('[MapPopup][Map] popup close', { id, activeId: activePopupId.value })
  if (activePopupId.value !== id) {
    return
  }

  activePopupId.value = null
}

// Auto-scroll images
useIntervalFn(() => {
  if (props.points.locations.length > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % 2;
  }
}, 3000);
useIntervalFn(() => {
  radiusPulseProgress.value = (radiusPulseProgress.value + 0.012) % 1
}, 60);

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
  nextTick(() => {
    isMapReady.value = true
  })
  applyCoordinatesMode()
});

watch(
  () => props.coordsMode,
  () => {
    if (!isMapReady.value) return
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
    <yandex-map-feature :settings="userAccessRadiusFeatureSettings" />
    <yandex-map-feature :settings="userAccessWaveOneFeatureSettings" />
    <yandex-map-feature :settings="userAccessWaveTwoFeatureSettings" />

    <yandex-map-default-marker
      v-model="defaultMarker"
      :settings="userMarkerSettings"
    />

    <Marcer
      v-if="isMapReady"
      v-for="point in props.points.locations"
      :marker-id="point.documentId ?? `${point.lat}-${point.lon}`"
      :coords="{
        lon: +point.lon,
        lat: +point.lat
      }"
      :mi="distanceCheckCoords"
      :images="url(point)"
      :current-image="currentImageIndex"
      :name="point.name"
      :description="point.description"

      :completed="Boolean(point.documentId && completedLocationIdsSet.has(point.documentId))"
      :popup-open="activePopupId === (point.documentId ?? `${point.lat}-${point.lon}`)"
      @mouseenter="showPopup"
      @mouseleave="hidePopup"
      @marker-click="handleMarkerClick"
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