<script setup lang="ts">
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

const props = defineProps<{
  /**
   * id записи города в базе данных
   */
  id: string
}>()

const { find, findOne } = useStrapi()
const { fetchUser } = useStrapiAuth()

const city = await findOne('cities', props.id, {
  populate: { maps: { populate: ['locations', 'image'] } },
})
const progressValues = ref<Record<string, number>>({})

onMounted(async () => {
  const user = await fetchUser()
  const userId = user.value?.documentId

  for (const map of city.data.maps) {
    const mapData = await findOne('maps', map.documentId, { populate: 'locations' })
    const progresses = await find('user-location-progresses', {
      filters: {
        users_permissions_user: { documentId: userId },
        location: { map: { documentId: map.documentId } }
      }
    })
    const total = mapData?.data?.locations?.length ?? 0
    const done = progresses?.data?.length ?? 0
    progressValues.value[map.id] =
      total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  }
})

const slidesPerView = ref<'auto' | number>('auto')
const spaceBetween = ref(26)
const slidesOffsetAfter = ref(96)

const updateSlidesPerView = () => {
  if (window.innerWidth < 380) {
    slidesPerView.value = 'auto'
    spaceBetween.value = Math.round(window.innerWidth * 0.028)
    slidesOffsetAfter.value = Math.round(window.innerWidth * 0.05)
  } else if (window.innerWidth < 768) {
    slidesPerView.value = 'auto'
    spaceBetween.value = Math.round(window.innerWidth * 0.033)
    slidesOffsetAfter.value = Math.round(window.innerWidth * 0.078)
  } else if (window.innerWidth < 1024) {
    slidesPerView.value = 'auto'
    spaceBetween.value = Math.round(window.innerWidth * 0.04)
    slidesOffsetAfter.value = Math.round(window.innerWidth * 0.11)
  } else {
    slidesPerView.value = 'auto'
    spaceBetween.value = 28
    slidesOffsetAfter.value = 112
  }
}

onMounted(() => {
  updateSlidesPerView()
  window.addEventListener('resize', updateSlidesPerView)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSlidesPerView)
})

const onSwiper = (swiper: any) => {
  swiper.loopCreate()
}
</script>

<template>
  <div class="swiper-wrapper">
    <div class="swiper-container">
      <swiper
        :modules="[Autoplay]"
        :slides-per-view="slidesPerView"
        :space-between="spaceBetween"
        :slides-offset-after="slidesOffsetAfter"
        :loop="true"
        :grab-cursor="true"
        :centered-slides="false"
        :initial-slide="0"
        class="plot-swiper"
        @swiper="onSwiper"
      >
        <swiper-slide v-for="map in city.data.maps" :key="map.id" class="plot-slide">
          <Plots
            :id="map.documentId"
            :title="map.name"
            :description="map.description ?? ''"
            :cover-url="useStrapiMediaUrl(map.image)"
            :percent="progressValues[map.id] || 0"
          />
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>

<style scoped>
.swiper-wrapper {
    overflow: visible;
    width: 100%;
}

.swiper-container {
  width: 100%;
  overflow: visible;
}

.plot-swiper {
  overflow: visible;
  width: 100%;
  position: relative;
}

.plot-slide {
  width: min(340px, 100%) !important;
  transition: transform 0.25s ease, opacity 0.25s ease;
  transform: scale(0.94);
  transform-origin: left center;
  opacity: 0.82;
  position: relative;
  z-index: 1;
}

.plot-slide.swiper-slide-active {
  opacity: 1;
  transform: scale(1);
  z-index: 3;
}

.plot-slide.swiper-slide-next,
.plot-slide.swiper-slide-prev {
  opacity: 0.92;
  transform: scale(0.97);
  z-index: 2;
}

@media (max-width: 768px) {
  .plot-swiper {
    padding: 0;
    overflow: visible;
  }
  
  .plot-slide {
    width: min(86vw, 100%) !important;
  }
}

@media (max-width: 380px) {
  .plot-slide {
    width: min(82vw, 100%) !important;
  }
}
</style>
