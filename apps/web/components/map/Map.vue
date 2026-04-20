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
     /**
     * Долгота
     */
  lat: number,
       /**
     * Широта
     */
  lon: number,
}

const props = defineProps<{
  /**
   * точки
   */
  points: Point[]
}>();

const defaultMarker = shallowRef<YMapDefaultMarker | null>(null);
const currentImageIndex = ref(0);
const isPopupVisible = ref(false);
const popupOpacity = ref(0);

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

// Auto-scroll images
useIntervalFn(() => {
  if (props.points.locations.length > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % 2;
  }
}, 3000);

onMounted(() => {
  showPopup();
});
function url(point) {

if (point.images === null) {
  return []
}
 const urls = point.images.map(item => item.url)
 
 
 return urls
}
const center_map = ref([44.746292, 48.797957]) 
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
        coordinates: [44.746292,48.797957],
        title: `Долгота: ${defaultMarker?.coordinates[0].toFixed(2)}<br>Широта: ${defaultMarker?.coordinates[1].toFixed(2)}`,
        draggable: true,
        onDragMove,
        onClick(event, mapEvent) {
          console.log(defaultMarker?.coordinates);
        },
        color: 'green',

      }"
    />

    <Marcer 
      v-for="point in props.points.locations"
      @click="() => {center_map = [  +point.lat, +point.lon,]}"
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
      @select="(async () => {
        await navigateTo(`/locationStory/${point.documentId}`)
      })"
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
  opacity: v-bind(popupOpacity);
  transform: translateY(v-bind(isPopupVisible ? '0' : '-10px'));
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