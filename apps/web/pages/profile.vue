<script setup lang="ts">
import { getData, setData } from '~/composables/useLocalStore'

const { fetchUser, logout } = useStrapiAuth()
const user = await fetchUser()
const { find } = useStrapi() // Убрали findOne, он больше не нужен
const userId = user.value?.documentId
const playerData = usePlayerDataUser()

const FALLBACK_SUSLIK = '/images/suslo.svg'

function outfitUrlsFromCloth(cloth: Record<string, unknown> | undefined, fallbackSislik: string) {
  const sislikUrl = useStrapiMediaUrlFirst(cloth?.sislik)
  const dataUrl = useStrapiMediaUrl(cloth?.data)
  return {
    dataUrl: dataUrl || '/images/Jacket.svg',
    sislikUrl: sislikUrl || dataUrl || fallbackSislik,
  }
}

const ownedCloths = ref<Array<{
  documentId: string
  clothUserDocumentId: string
  dataUrl: string
  sislikUrl: string
}>>([])

let dataUserRow: Record<string, unknown> | null = null
if (userId) {
  dataUserRow = await playerData.loadOrCreateDataUser()
}

const { exp } = playerData

const suslic = ref(FALLBACK_SUSLIK)
if (userId && dataUserRow?.cloth_user) {
  const cloth = (dataUserRow.cloth_user as Record<string, unknown>).cloth as
    | Record<string, unknown>
    | undefined
  const { sislikUrl } = outfitUrlsFromCloth(cloth, FALLBACK_SUSLIK)
  suslic.value = sislikUrl
}

if (userId) {
  const clothUsersRes = await find('cloth-users', {
    filters: {
      users_permissions_user: { documentId: { $eq: userId } },
    },
    populate: {
      cloth: { populate: { data: true, sislik: true } },
    },
  })
  const byId = new Map<
    string,
    { documentId: string, clothUserDocumentId: string, dataUrl: string, sislikUrl: string }
  >()
  for (const row of (clothUsersRes?.data ?? []) as Array<Record<string, unknown>>) {
    const cloth = row.cloth as Record<string, unknown> | undefined
    if (!cloth?.documentId) continue
    const id = String(cloth.documentId)
    if (byId.has(id)) continue
    const clothUserDocumentId = row.documentId != null ? String(row.documentId) : ''
    if (!clothUserDocumentId) continue
    const { dataUrl, sislikUrl } = outfitUrlsFromCloth(cloth, FALLBACK_SUSLIK)
    byId.set(id, {
      documentId: id,
      clothUserDocumentId,
      dataUrl,
      sislikUrl,
    })
  }
  ownedCloths.value = [...byId.values()]
}

const name = user.value?.username!

// Загрузка ачивок
const achievements = await find('user-achievements', {
  populate: {
    achievement: true
  }
})

// === ИСПРАВЛЕННАЯ ЛОГИКА ГОРОДОВ ===
// 1. Загружаем все города один раз
const cities = await find('cities')

// 2. Достаем сохраненный ID города
const savedCityId = getData('cityId')

// 3. Вычисляем текущий объект города
const currentCity = computed(() => {
  if (!cities.data || !savedCityId) return null
  return cities.data.find((c: any) => c.documentId === savedCityId) || null
})

// 4. Сохраняем при выборе нового
const handleCitySelected = ({ city }: { city: string }) => {
  setData('cityId', city, 1, 'd')
}
// =====================================

type WardrobeSlot = {
  id: string
  kind: 'icon' | 'image' | 'empty'
  icon?: string
  image?: string
  outfit?: string | null
  clothUserDocumentId?: string
}

const WARDROBE_GRID_SLOTS = 12

const allowedClothUserIds = computed(
  () => new Set(ownedCloths.value.map(c => c.clothUserDocumentId)),
)

const wardrobeSlots = computed((): WardrobeSlot[] => {
  const slots: WardrobeSlot[] = [
    { id: 'reset', kind: 'icon', icon: 'mdi:close', outfit: FALLBACK_SUSLIK },
  ]
  for (const c of ownedCloths.value) {
    slots.push({
      id: c.documentId,
      kind: 'image',
      image: c.dataUrl,
      outfit: c.sislikUrl,
      clothUserDocumentId: c.clothUserDocumentId,
    })
  }
  let n = 0
  while (slots.length < WARDROBE_GRID_SLOTS) {
    slots.push({ id: `empty-${n++}`, kind: 'empty' })
  }
  return slots
})

const wardrobeSaving = ref(false)
const wardrobeError = ref('')

function suslikUrlFromDataUser(row: Record<string, unknown> | null, fallback: string): string {
  if (!row?.cloth_user) return fallback
  const cloth = (row.cloth_user as Record<string, unknown>).cloth as
    | Record<string, unknown>
    | undefined
  return outfitUrlsFromCloth(cloth, fallback).sislikUrl
}

const selectWardrobeSlot = async (slot: WardrobeSlot) => {
  if (!slot.outfit || wardrobeSaving.value) {
    return
  }

  if (!userId) {
    wardrobeError.value = 'Войди в аккаунт, чтобы сохранить образ'
    return
  }

  const prevSuslic = suslic.value
  wardrobeSaving.value = true
  wardrobeError.value = ''

  try {
    if (slot.id === 'reset') {
      await playerData.setEquippedClothUser(null)
      const fresh = await playerData.loadOrCreateDataUser()
      suslic.value = suslikUrlFromDataUser(fresh, FALLBACK_SUSLIK)
      console.info('[kvt] профиль: сброс образа (data-user.cloth_user очищен)', {
        dataUserDocumentId: fresh?.documentId,
      })
      return
    }

    if (!slot.clothUserDocumentId?.trim()) {
      wardrobeError.value = 'Нет данных костюма'
      return
    }

    if (!allowedClothUserIds.value.has(slot.clothUserDocumentId)) {
      wardrobeError.value = 'Этот костюм не в твоей коллекции'
      return
    }

    await playerData.setEquippedClothUser(slot.clothUserDocumentId)
    const fresh = await playerData.loadOrCreateDataUser()
    suslic.value = suslikUrlFromDataUser(fresh, slot.outfit ?? FALLBACK_SUSLIK)
    console.info('[kvt] профиль: костюм применён', {
      clothDocumentId: slot.id,
      clothUserDocumentId: slot.clothUserDocumentId,
      dataUserDocumentId: fresh?.documentId,
    })
  }
  catch (e) {
    suslic.value = prevSuslic
    const code = e instanceof Error ? e.message : ''
    if (code === 'CLOTH_USER_NOT_OWNED') {
      wardrobeError.value = 'Костюм не найден или чужой'
    }
    else if (code === 'RELATION_NOT_PERSISTED' || code === 'RELATION_CLEAR_FAILED') {
      wardrobeError.value = 'Сервер не сохранил образ — попробуй ещё раз'
    }
    else if (code === 'NO_USER' || code === 'NO_DATA_USER') {
      wardrobeError.value = 'Не удалось загрузить профиль игрока'
    }
    else {
      wardrobeError.value = 'Не удалось сохранить образ'
    }
    console.error('[profile] сохранить образ в data-user', e)
  }
  finally {
    wardrobeSaving.value = false
  }
}

const isWardrobeSlotActive = (slot: WardrobeSlot) =>
  Boolean(slot.outfit && suslic.value === slot.outfit)
</script>

<template>
  <div class="text-[20px] flex flex-col gap-0">
    
    <div class="bg-[#D3D3D5] px-[14px] pt-[12px] pb-[10px]">
      <div class="flex justify-between items-center gap-[10px]">
        <div class="flex items-center gap-[10px] min-w-0">
          <div class="w-[48px] h-[48px] rounded-full overflow-hidden bg-[#f2f2f2] shrink-0">
            <img src="/images/Semen.png" alt="Profile avatar" class="w-full h-full object-cover">
          </div>
          <div class="flex flex-col gap-[3px] min-w-0">
            <p class="m-0 text-[#111111] font-['Gothic_60'] text-[20px] leading-[0.92] truncate">{{ name }}</p>
            <p class="m-0 text-[#7e7e7e] font-['Gothic_60'] text-[10px] leading-[0.9] uppercase">{{ exp }} EXP</p>
          </div>
        </div>
        <div class="w-[min(156px,40vw)]">
            <CitySelect
              :cities="cities.data"
              :value="currentCity"
              @citySelected="handleCitySelected"
              placeholder="ГОРОД"
            />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-[20px] px-[14px] pt-[20px] pb-[80px]">

      <div class="flex flex-col gap-0">
        <div class="flex flex-row items-center justify-center relative -mb-[12px] [&_.text]:text-[24px] [&_.text]:text-center [&_.text]:mx-auto">
          <TwentyText>твой суслик</TwentyText>
        </div>
        <div class="grid grid-cols-[minmax(0,1fr)_minmax(132px,0.92fr)] gap-0 items-end">
          <div class="relative min-h-[288px] w-[calc(100%+70px)] max-w-[430px] flex items-end justify-start">
            <img src="/images/shopsuslik.svg" class="w-full h-auto block" alt="" aria-hidden="true">
            <img :src="suslic" class="absolute z-[1] left-[min(58%,230px)] bottom-[18px] h-[226px] w-auto -translate-x-1/2" alt="суслик в образе">
          </div>

          <div class="justify-self-end self-end flex flex-col items-end gap-[8px] mb-[28px] relative z-[2]">
            <p v-if="wardrobeError" class="m-0 text-[12px] leading-[1.3] text-[#b42318] max-w-[200px] text-right" role="alert">{{ wardrobeError }}</p>
            <div class="grid grid-cols-[repeat(3,47px)] gap-[6px] w-[153px] ml-0">
              <button
                v-for="slot in wardrobeSlots"
                :key="slot.id"
                type="button"
                class="w-[47px] h-[47px] border-none rounded-[16px] flex items-center justify-center p-0 disabled:cursor-default"
                :class="[
                  Boolean(slot.outfit) ? 'cursor-pointer' : '',
                  isWardrobeSlotActive(slot) ? 'outline outline-2 outline-[#5d7eea] -outline-offset-2 bg-[#edf1ff]' : 'bg-[#EFEFEF]'
                ]"
                :disabled="!slot.outfit || wardrobeSaving"
                @click="selectWardrobeSlot(slot)"
              >
                <img
                  v-if="slot.kind === 'image' && slot.image"
                  :src="slot.image"
                  alt=""
                  class="w-[30px] h-[30px] object-contain"
                >
                <Icon
                  v-else-if="slot.kind === 'icon' && slot.icon"
                  :name="slot.icon"
                  class="text-[28px] text-[#1d1d1f]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-[16px]">
        <div class="flex flex-row items-center justify-center relative [&_.text]:text-[24px] [&_.text]:text-center [&_.text]:mx-auto">
          <TwentyText>достижения</TwentyText>
          <NuxtLink class="text-[#6188f3] no-underline font-['Gothic_60'] text-[15px] leading-[0.9] absolute right-0 top-1/2 -translate-y-1/2 hover:opacity-85" to="/achivments">см.всё</NuxtLink>
        </div>
        <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[12px] items-stretch">
          <ProfileAchievementCard
            v-for="i in achievements.data"
            :key="i.documentId"
            :id="i.documentId"
            :collected="Boolean(i.collected)"
            :description="String(i.achievement?.description || '')"
            :title="String(i.achievement?.title || '')"
          />
        </div>
      </div>
      
    </div>
    <FooterNav />
  </div>
</template>