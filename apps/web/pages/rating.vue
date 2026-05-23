<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { getData } from '~/composables/useLocalStore'

type RatingItem = {
  userDocumentId: string
  place: number
  name: string
  percent: number
  isCurrentUser: boolean
  completedCount: number
  totalLocations: number
  suslikUrl: string
  exp: number
}

const FALLBACK_SUSLIK = '/images/suslo.svg'

const DATA_USER_POPULATE = {
  cloth_user: {
    populate: {
      cloth: { populate: { data: true, sislik: true } },
    },
  },
} as const

function suslikFromDataUserRow(row: Record<string, unknown> | null | undefined): {
  suslikUrl: string
  exp: number
} {
  if (!row) return { suslikUrl: FALLBACK_SUSLIK, exp: 0 }
  const cloth = (row.cloth_user as Record<string, unknown> | undefined)?.cloth as
    | Record<string, unknown>
    | undefined
  const sislikUrl = useStrapiMediaUrlFirst(cloth?.sislik)
  const dataUrl = useStrapiMediaUrl(cloth?.data)
  const suslikUrl = sislikUrl || dataUrl || FALLBACK_SUSLIK
  return { suslikUrl, exp: Number(row.exp ?? 0) }
}

type StrapiFind = (collection: string, options?: Record<string, unknown>) => Promise<{ data?: unknown[] }>

async function fetchDataUserExtrasByUserIds(
  findFn: StrapiFind,
  userIds: string[],
): Promise<Map<string, { suslikUrl: string, exp: number }>> {
  const map = new Map<string, { suslikUrl: string, exp: number }>()
  const unique = [...new Set(userIds.filter(Boolean))]
  const chunk = 8
  for (let i = 0; i < unique.length; i += chunk) {
    const slice = unique.slice(i, i + chunk)
    await Promise.all(
      slice.map(async (uid) => {
        try {
          const res = await findFn('data-users', {
            filters: { users_permissions_user: { documentId: { $eq: uid } } },
            populate: DATA_USER_POPULATE,
            pagination: { pageSize: 1 },
          })
          const row = (res?.data?.[0] ?? null) as Record<string, unknown> | null
          map.set(uid, suslikFromDataUserRow(row))
        }
        catch {
          map.set(uid, { suslikUrl: FALLBACK_SUSLIK, exp: 0 })
        }
      }),
    )
  }
  return map
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

    const userIdsForExtras = Array.from(usersProgress.keys())
    const extrasByUser = await fetchDataUserExtrasByUserIds(find, userIdsForExtras)

    ratingItems.value = Array.from(usersProgress.entries())
      .map(([userId, userProgress]) => {
        const completedLocations = userProgress.locations.size
        const percent = totalLocations > 0
          ? Math.round((completedLocations / totalLocations) * 100)
          : 0
        const extra = extrasByUser.get(userId) ?? { suslikUrl: FALLBACK_SUSLIK, exp: 0 }

        return {
          userDocumentId: userId,
          place: 0,
          name: userProgress.name,
          percent,
          isCurrentUser: currentUserId === userId,
          completedCount: completedLocations,
          totalLocations,
          suslikUrl: extra.suslikUrl,
          exp: extra.exp,
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
  <div class="w-[min(100%,760px)] mx-auto pt-[14px] px-[16px] pb-[104px] flex flex-col gap-[14px]">
    
    <header class="relative flex items-center min-h-[40px]">
      <button class="relative z-[1] w-[40px] h-[40px] rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] inline-flex items-center justify-center text-[#1f2937] cursor-pointer" type="button" aria-label="Вернуться назад" @click="goBack">
        <ArrowLeft :stroke-width="2" class="w-[18px] h-[18px]" />
      </button>
      <TwentyText class="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-max max-w-[calc(100%-100px)]">рейтинг</TwentyText>
    </header>

    <div class="flex flex-col gap-[6px]">
      <p class="m-0 text-[#6b7280] text-[13px] leading-[1.35]">по прогрессу прохождения локаций в выбранном городе</p>
    </div>

    <div v-if="isLoading" class="min-h-[64px] w-[calc(100%-2px)] flex justify-center items-center py-[10px] px-[12px] rounded-[16px] bg-[#f3f4f6] border border-[#e5e7eb]">
      <TwentyText>загрузка...</TwentyText>
    </div>

    <div v-else-if="loadError" class="min-h-[64px] w-[calc(100%-2px)] flex justify-center items-center py-[10px] px-[12px] rounded-[16px] bg-[#fef2f2] border border-[#fecaca]">
      <TwentyText>{{ loadError }}</TwentyText>
    </div>

    <div v-else-if="ratingItems.length === 0" class="min-h-[64px] w-[calc(100%-2px)] flex justify-center items-center py-[10px] px-[12px] rounded-[16px] bg-[#f3f4f6] border border-[#e5e7eb]">
      <TwentyText>данных пока нет</TwentyText>
    </div>

    <div v-else class="flex flex-col gap-[10px]">
      <RatingBlock
        v-for="item in ratingItems"
        :key="item.userDocumentId"
        :place="item.place"
        :name="item.name"
        :percent="item.percent"
        :is-current-user="item.isCurrentUser"
        :suslik-url="item.suslikUrl"
        :exp="item.exp"
        :completed-count="item.completedCount"
        :total-locations="item.totalLocations"
      />
    </div>

    <FooterNav />
  </div>
</template>