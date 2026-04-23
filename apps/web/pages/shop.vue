<script setup lang="ts">
const FALLBACK_ITEM = '/images/Jacket.svg'

const { fetchUser } = useStrapiAuth()
const user = await fetchUser()
const name = user.value?.username!
const userId = user.value?.documentId

const { find, create } = useStrapi()
/** Тот же клиент, что и у `find`, с JWT — для маршрутов `…/count` из users-permissions и Content API. */
const strapiRequest = useStrapiClient()

function normalizeStrapiCount(payload: unknown): number {
  if (typeof payload === 'number' && Number.isFinite(payload))
    return Math.max(0, Math.floor(payload))
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const d = (payload as { data: unknown }).data
    if (typeof d === 'number' && Number.isFinite(d))
      return Math.max(0, Math.floor(d))
  }
  return 0
}

/** `GET /api/users/count` — в админке роль: User → count (как на скриншоте). */
async function fetchUsersCount(): Promise<number | null> {
  try {
    const raw = await strapiRequest('/users/count', { method: 'GET' })
    return normalizeStrapiCount(raw)
  }
  catch {
    return null
  }
}

/** Пагинация `find('cloth-users')` — по одной записи на пару user + cloth (схема manyToOne). */
const CLOTH_USERS_PAGE = 100
const findAllClothUsers = async () => {
  const rows: Array<Record<string, unknown>> = []
  let page = 1
  let pageCount = 1
  do {
    const response = await find('cloth-users', {
      fields: ['documentId'],
      populate: {
        cloth: { fields: ['documentId'] },
        users_permissions_user: { fields: ['documentId'] },
      },
      pagination: { page, pageSize: CLOTH_USERS_PAGE },
    })
    rows.push(...(response?.data ?? []) as Array<Record<string, unknown>>)
    pageCount = response?.meta?.pagination?.pageCount ?? 1
    page += 1
  } while (page <= pageCount)
  return rows
}

/** Уникальные пользователи по каждому cloth (одна запись cloth-user = один user + один cloth). */
function ownersByClothFromRows(
  rows: Array<Record<string, unknown>>,
  clothIds: string[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const cid of clothIds) map.set(cid, new Set())
  for (const row of rows) {
    const cloth = row.cloth as { documentId?: string } | undefined
    const cid = cloth?.documentId != null ? String(cloth.documentId) : ''
    const user = row.users_permissions_user as { documentId?: string } | undefined
    const uid = user?.documentId
    if (!cid || !uid || !map.has(cid)) continue
    map.get(cid)!.add(uid)
  }
  return map
}

type OwnershipAgg = Record<string, { owners: number, base: number }>

const { data: shopState, refresh: refreshShop } = await useAsyncData(
  `shop-cloths-${userId ?? 'guest'}`,
  async () => {
    const clothsRes = await find('cloths', {
      populate: { data: true, sislik: true },
    })
    const cloths = clothsRes?.data ?? []
    const ownedIds = new Set<string>()
    if (userId) {
      const cuRes = await find('cloth-users', {
        filters: {
          users_permissions_user: { documentId: { $eq: userId } },
        },
        populate: { cloth: true },
      })
      for (const row of cuRes?.data ?? []) {
        const c = row.cloth as { documentId?: string } | undefined
        if (c?.documentId) ownedIds.add(String(c.documentId))
      }
    }

    const ownershipByClothId: OwnershipAgg = {}
    const totalUsers = await fetchUsersCount()

    const base = totalUsers ?? 0
    const clothIds = cloths
      .map((c: { documentId?: string }) => (c?.documentId != null ? String(c.documentId) : ''))
      .filter((id: string) => id.length > 0)

    try {
      const cuRows = await findAllClothUsers()
      const ownersMap = ownersByClothFromRows(cuRows, clothIds)
      for (const cid of clothIds) {
        const raw = ownersMap.get(cid)?.size ?? 0
        const owners = base > 0 ? Math.min(raw, base) : raw
        ownershipByClothId[cid] = { owners, base }
      }
    }
    catch {
      for (const cid of clothIds)
        ownershipByClothId[cid] = { owners: 0, base }
    }

    return { cloths, ownedIds: [...ownedIds], ownershipByClothId, totalUsers }
  },
)

function ownershipLines(
  agg: { owners: number, base: number } | undefined,
  totalUsersKnown: boolean,
) {
  if (!totalUsersKnown) {
    return {
      pct: null as number | null,
      caption: 'не удалось загрузить число всех игроков',
      captionShort: '',
    }
  }
  if (!agg || agg.base <= 0) {
    return {
      pct: null as number | null,
      caption: 'пока нет зарегистрированных игроков',
      captionShort: '',
    }
  }
  const have = Math.min(Math.max(0, agg.owners), agg.base)
  const pct = Math.round((have / agg.base) * 100)
  const line = `есть у ${pct}% игроков`
  return {
    pct,
    caption: line,
    captionShort: line,
  }
}

const shopItems = computed(() => {
  const rows = shopState.value?.cloths ?? []
  const owned = new Set(shopState.value?.ownedIds ?? [])
  const byCloth = shopState.value?.ownershipByClothId ?? {}
  const totalUsersKnown = shopState.value?.totalUsers != null
  const items = rows.map((cloth: Record<string, unknown>, index: number) => {
    const id = String(cloth.documentId ?? index)
    const sislikUrl = useStrapiMediaUrlFirst(cloth.sislik)
    const dataUrl = useStrapiMediaUrl(cloth.data)
    const hero = sislikUrl || dataUrl || FALLBACK_ITEM
    const rawName = cloth.name
    const title = typeof rawName === 'string' && rawName.trim().length
      ? rawName.trim()
      : `костюм ${index + 1}`
    const rawDesc = cloth.description
    const description = typeof rawDesc === 'string' && rawDesc.trim().length
      ? rawDesc.trim()
      : 'стиль для твоего суслика на прогулках по городу'
    const ownStat = ownershipLines(byCloth[id], totalUsersKnown)
    return {
      id,
      title,
      description,
      image: hero,
      owned: owned.has(id),
      ownershipCaption: ownStat.caption,
      ownershipCaptionShort: ownStat.captionShort,
      hasOwnershipStat: ownStat.pct !== null,
    }
  })
  return items.sort((a, b) => {
    if (a.owned === b.owned) return 0
    return a.owned ? -1 : 1
  })
})

const buyingId = ref<string | null>(null)
const buyError = ref('')

async function buyCloth(documentId: string) {
  buyError.value = ''
  if (!userId) {
    buyError.value = 'нужна авторизация'
    return
  }
  buyingId.value = documentId
  try {
    const existing = await find('cloth-users', {
      filters: {
        users_permissions_user: { documentId: { $eq: userId } },
        cloth: { documentId: { $eq: documentId } },
      },
      populate: { cloth: true },
    })
    if ((existing?.data?.length ?? 0) > 0) {
      await refreshShop()
      return
    }
    await create('cloth-users', {
      cloth: documentId,
      users_permissions_user: userId,
    })
    await refreshShop()
  }
  catch (e) {
    console.error('[shop] buy cloth', e)
    buyError.value = 'не удалось добавить в коллекцию'
  }
  finally {
    buyingId.value = null
  }
}
</script>

<template>
  <div class="main">
    <TheHeader :username="name" />

    <div class="display">
      <section class="hero-card">
        <div class="hero-top">
          <TwentyText>магазин</TwentyText>
        </div>
        <p class="hero-subtitle">здесь разные костюмы для твоего суслика</p>
        <p v-if="buyError" class="hero-error">{{ buyError }}</p>
      </section>

      <section v-if="!shopItems.length" class="empty-note">
        <p>пока нет костюмов в каталоге — добавь записи cloth в Strapi</p>
      </section>

      <section v-else class="catalog">
        <article v-for="item in shopItems" :key="item.id" class="item-card" :class="{ 'item-card--owned': item.owned }">
          <span v-if="item.owned" class="item-ribbon" aria-hidden="true">в коллекции</span>
          <div class="item-visual">
            <img :src="item.image" :alt="item.title" class="item-image">
          </div>

          <div class="item-body">
            <div v-if="item.owned" class="item-title-row">
              <p class="item-name">{{ item.title }}</p>
            </div>
            <div v-else class="item-title-row item-title-row--split">
              <p class="item-name">{{ item.title }}</p>
              <p
                v-if="item.hasOwnershipStat && item.ownershipCaptionShort"
                class="item-pct"
              >
                {{ item.ownershipCaptionShort }}
              </p>
              <p v-else class="item-pct item-pct--muted">
                {{ item.ownershipCaption }}
              </p>
            </div>
            <p class="item-description">
              {{ item.description }}
            </p>
          </div>

          <div class="item-footer">
            <template v-if="item.owned">
              <div class="item-owned-panel" role="status">
                <p class="item-owned-panel__stat">{{ item.ownershipCaption }}</p>
              </div>
            </template>
            <template v-else>
              <ButtonAction
                class="item-btn"
                :disabled="buyingId === item.id"
                @click="buyCloth(item.id)"
              >
                {{ buyingId === item.id ? '…' : 'купить' }}
              </ButtonAction>
            </template>
          </div>
        </article>
      </section>
    </div>

    <FooterNav />
  </div>
</template>

<style scoped>
.main {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: #f4f5f7;
}

.display {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 16px 112px;
}

.hero-card {
  border-radius: 18px;
  padding: 14px;
  background: linear-gradient(136deg, #ffffff 0%, #edf2ff 100%);
  border: 1px solid #e4e7ee;
  box-shadow: 0 6px 20px rgba(17, 24, 39, 0.06);
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.hero-subtitle {
  margin: 0;
  margin-top: 8px;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.3;
}

.hero-error {
  margin: 8px 0 0;
  color: #b91c1c;
  font-size: 13px;
}

.empty-note {
  margin: 0;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 14px;
}

.catalog {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.item-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 12px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 310px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.item-card--owned {
  border-color: #c7d2fe;
  background: linear-gradient(160deg, #ffffff 0%, #eef2ff 100%);
}

.item-ribbon {
  position: absolute;
  top: 14px;
  right: -34px;
  z-index: 2;
  transform: rotate(42deg);
  padding: 5px 38px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(90deg, #a5b4fc, #818cf8);
  box-shadow: 0 1px 8px rgba(99, 102, 241, 0.22);
  pointer-events: none;
}

.item-name {
  margin: 0;
  font-family: 'Gothic 60';
  font-size: 17px;
  line-height: 1.12;
  color: #111827;
  min-height: 38px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.item-visual {
  height: 142px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: radial-gradient(circle at 30% 20%, #fef3c7 0%, #f3f4f6 52%, #e5e7eb 100%);
  border: 1px solid #e5e7eb;
  padding: 10px;
}

.item-image {
  width: min(110px, 100%);
  height: auto;
  max-height: 130px;
  object-fit: contain;
  filter: drop-shadow(0 6px 10px rgba(15, 23, 42, 0.16));
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-title-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.item-title-row--split {
  justify-content: space-between;
  align-items: flex-start;
}

.item-title-row--split .item-name {
  flex: 1;
  min-width: 0;
}

.item-pct {
  margin: 0;
  flex-shrink: 0;
  max-width: 46%;
  font-size: 11px;
  line-height: 1.25;
  font-weight: 600;
  color: #6b7280;
  text-align: right;
  align-self: flex-start;
  transform: translateY(-3px);
}

.item-pct--muted {
  font-weight: 500;
  color: #9ca3af;
}

.item-description {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.25;
  min-height: 30px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
}

.item-owned-panel {
  width: 100%;
  padding: 12px 12px 14px;
  border-radius: 14px;
  background: #e8eaf0;
  border: 1px dashed #c4c9d4;
  text-align: center;
}

.item-owned-panel__stat {
  margin: 0;
  font-size: 14px;
  line-height: 1.35;
  font-weight: 600;
  color: #374151;
}

.item-btn {
  width: 100%;
}

@media (max-width: 820px) {
  .display {
    padding-inline: 12px;
  }

  .catalog {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .item-card {
    min-height: 286px;
  }
}

@media (min-width: 1024px) {
  .display {
    max-width: 760px;
    width: 100%;
    margin: 0 auto;
    padding-bottom: 132px;
  }
}
</style>
