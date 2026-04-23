<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { getData } from '~/composables/useLocalStore'

type RatingItem = {
  place: number
  name: string
  percent: number
  isCurrentUser: boolean
}

const { find } = useStrapi()
const { fetchUser } = useStrapiAuth()

const ratingItems = ref<RatingItem[]>([])
const isLoading = ref(true)
const loadError = ref('')
const PAGE_SIZE = 100
const router = useRouter()

const findAll = async (collection: string, options: Record<string, any>) => {
  const allItems: any[] = []
  let page = 1
  let pageCount = 1

  do {
    const response = await find(collection, {
      ...options,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
      },
    })

    allItems.push(...(response?.data ?? []))
    pageCount = response?.meta?.pagination?.pageCount ?? 1
    page += 1
  } while (page <= pageCount)

  return allItems
}

const loadRating = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const selectedCityId = getData<string>('cityId')
    if (!selectedCityId) {
      ratingItems.value = []
      return
    }

    const [currentUser, city] = await Promise.all([
      fetchUser(),
      find('cities', {
        filters: {
          documentId: { $eq: selectedCityId },
        },
        populate: 'maps',
      }),
    ])

    const mapIds: string[] = (city?.data?.[0]?.maps ?? [])
      .map((mapItem: any) => mapItem?.documentId)
      .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)

    if (mapIds.length === 0) {
      ratingItems.value = []
      return
    }

    const maps = await findAll('maps', {
      filters: {
        documentId: {
          $in: mapIds,
        },
      },
      populate: 'locations',
    })

    const locationIds = new Set<string>()
    for (const mapItem of maps) {
      for (const location of mapItem?.locations ?? []) {
        if (location?.documentId) {
          locationIds.add(location.documentId)
        }
      }
    }

    if (locationIds.size === 0) {
      ratingItems.value = []
      return
    }

    const progresses = await findAll('user-location-progresses', {
      filters: {
        location: {
          map: {
            documentId: {
              $in: mapIds,
            },
          },
        },
      },
      populate: {
        users_permissions_user: true,
        location: true,
      },
    })

    const totalLocations = locationIds.size

    const usersProgress = new Map<string, { name: string, locations: Set<string> }>()

    for (const progress of progresses) {
      const userId = progress?.users_permissions_user?.documentId as string | undefined
      const username = progress?.users_permissions_user?.username as string | undefined
      const locationId = progress?.location?.documentId as string | undefined

      if (!userId || !locationId) {
        continue
      }

      if (!usersProgress.has(userId)) {
        usersProgress.set(userId, {
          name: username || 'Пользователь',
          locations: new Set<string>(),
        })
      }

      usersProgress.get(userId)?.locations.add(locationId)
    }

    const currentUserId = currentUser.value?.documentId as string | undefined
    const currentUsername = currentUser.value?.username as string | undefined

    if (currentUserId && !usersProgress.has(currentUserId)) {
      usersProgress.set(currentUserId, {
        name: currentUsername || 'Вы',
        locations: new Set<string>(),
      })
    }

    ratingItems.value = Array.from(usersProgress.entries())
      .map(([userId, userProgress]) => {
        const completedLocations = userProgress.locations.size
        const percent = totalLocations > 0
          ? Math.round((completedLocations / totalLocations) * 100)
          : 0

        return {
          place: 0,
          name: userProgress.name,
          percent,
          isCurrentUser: currentUserId === userId,
        }
      })
      .sort((left, right) => right.percent - left.percent || left.name.localeCompare(right.name, 'ru'))
      .map((item, index) => ({
        ...item,
        place: index + 1,
      }))
  } catch (error) {
    loadError.value = 'Не удалось загрузить рейтинг'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const goBack = async () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  await navigateTo('/general')
}

onMounted(() => {
  void loadRating()
})
</script>

<template>
  <div class="rating-area-block">
    <header class="rating-header">
      <button class="back-btn" type="button" aria-label="Вернуться назад" @click="goBack">
        <ArrowLeft :stroke-width="2" class="back-icon" />
      </button>
      <TwentyText class="header-title">рейтинг</TwentyText>
      <div class="header-space" aria-hidden="true" />
    </header>

    <div class="rating-head">
      <p class="rating-subtitle">по прогрессу прохождения локаций в выбранном городе</p>
    </div>

    <div v-if="isLoading" class="rating-state">
      <TwentyText>загрузка...</TwentyText>
    </div>

    <div v-else-if="loadError" class="rating-state error">
      <TwentyText>{{ loadError }}</TwentyText>
    </div>

    <div v-else-if="ratingItems.length === 0" class="rating-state">
      <TwentyText>данных пока нет</TwentyText>
    </div>

    <div v-else class="rating-list">
      <RatingBlock
        v-for="item in ratingItems"
        :key="`${item.name}-${item.place}`"
        :place="item.place"
        :name="item.name"
        :percent="item.percent"
        :is-current-user="item.isCurrentUser"
      />
    </div>

    <FooterNav />
  </div>
</template>

<style scoped>
.rating-area-block{
    width: min(100%, 760px);
    margin: 0 auto;
    padding: 18px 16px 108px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.rating-header {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 10px;
}

.header-title {
  text-align: center;
}

.header-space {
  width: 40px;
  height: 40px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1f2937;
  cursor: pointer;
}

.back-icon {
  width: 18px;
  height: 18px;
}

.rating-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rating-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.35;
}

.rating-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rating-state {
  min-height: 64px;
  width: calc(100% - 2px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 12px;
  border-radius: 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.rating-state.error {
  border-color: #fecaca;
  background: #fef2f2;
}

@media (max-width: 480px) {
  .rating-area-block {
    padding-top: 14px;
    padding-bottom: 104px;
  }

  .rating-subtitle {
    font-size: 13px;
  }
}

</style>