<script setup lang="ts">
import { computed, ref, onActivated } from 'vue'
import { ArrowLeft, CalendarDays, ChevronDown } from 'lucide-vue-next'
import { getData } from '~/composables/useLocalStore'

type CityEventRow = {
  documentId: string
  slug: string | null
  title: string
  scheduleText: string
  description: string | null
  expCost: number
  startsAt: string | null // Точная дата и время из Strapi
}

/** Только поля из Strapi (REST v5, camelCase); без подстановок с клиента. */
function normalizeCityEvent(raw: Record<string, unknown>): CityEventRow | null {
  const documentId = raw.documentId != null ? String(raw.documentId) : ''
  if (!documentId)
    return null
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title)
    return null
  const scheduleText = typeof raw.scheduleText === 'string' ? raw.scheduleText : ''
  const description = typeof raw.description === 'string' ? raw.description : null
  const slugRaw = (raw as { slug?: unknown }).slug
  const slug = typeof slugRaw === 'string' && slugRaw.trim() ? slugRaw.trim() : null

  // Достаем точную дату из базы
  const startsAtRaw = (raw as { startsAt?: unknown }).startsAt
  const startsAt = typeof startsAtRaw === 'string' ? startsAtRaw : null

  const expRaw = (raw as { expCost?: unknown }).expCost
  let expCost = 0
  if (expRaw !== undefined && expRaw !== null) {
    const expNum = typeof expRaw === 'number' ? expRaw : Number(expRaw)
    if (!Number.isFinite(expNum) || expNum < 0)
      return null
    expCost = Math.floor(expNum)
  }
  return {
    documentId,
    slug,
    title,
    scheduleText,
    description,
    expCost,
    startsAt,
  }
}

/** Один documentId + один логический слот (slug или title+время), чтобы не дублировать карточки при дублях в CMS. */
function dedupeCityEvents(rows: CityEventRow[]): CityEventRow[] {
  const byDoc = new Map<string, CityEventRow>()
  for (const r of rows) {
    if (!byDoc.has(r.documentId))
      byDoc.set(r.documentId, r)
  }
  const seenLogical = new Set<string>()
  const out: CityEventRow[] = []
  for (const r of byDoc.values()) {
    const logical = r.slug ? `slug:${r.slug}` : `ts:${r.title}\u0000${r.scheduleText}`
    if (seenLogical.has(logical))
      continue
    seenLogical.add(logical)
    out.push(r)
  }
  return out
}

const { findOne, find, create } = useStrapi()
const { fetchUser } = useStrapiAuth()
const { exp, loadOrCreateDataUser, addExp } = usePlayerDataUser()
const { pushUserNotification } = usePushUserNotification()

const cityId = getData<string>('cityId')
const city = ref<Record<string, unknown> | null>(null)

if (cityId) {
  city.value = (await findOne('cities', cityId)) as Record<string, unknown> | null
}

const cityName = computed(() => {
  const d = city.value?.data as Record<string, unknown> | undefined
  const name = d?.name
  return typeof name === 'string' && name.trim() ? name.trim() : 'ваш город'
})

const cityEvents = ref<CityEventRow[]>([])
const registeredEventIds = ref<string[]>([])
const statusText = ref('')
const eventsLoadError = ref('')

async function loadCityEvents() {
  eventsLoadError.value = ''
  if (!cityId) {
    cityEvents.value = []
    return
  }
  try {
    const res = await find('city-events', {
      filters: {
        city: { documentId: { $eq: cityId } },
        publishedAt: { $notNull: true },
      },
      sort: ['startsAt:asc'],
      pagination: { pageSize: 100 },
    })
    const rows = ((res?.data ?? []) as Array<Record<string, unknown>>)
      .map(normalizeCityEvent)
      .filter((r): r is CityEventRow => r != null)
    cityEvents.value = dedupeCityEvents(rows)
  }
  catch (e) {
    console.error('[city] load city-events', e)
    eventsLoadError.value = 'Не удалось загрузить мероприятия'
    cityEvents.value = []
  }
}

async function loadRegistrationsForUser(userDocumentId: string) {
  if (!cityId) {
    registeredEventIds.value = []
    return
  }
  try {
    const res = await find('city-event-registrations', {
      filters: {
        users_permissions_user: { documentId: { $eq: userDocumentId } },
      },
      populate: {
        city_event: {
          fields: ['documentId'],
          populate: {
            city: { fields: ['documentId'] },
          },
        },
      },
    })
    const ids: string[] = []
    for (const row of (res?.data ?? []) as Array<Record<string, unknown>>) {
      const ce = row.city_event as Record<string, unknown> | undefined
      const evId = ce?.documentId != null ? String(ce.documentId) : ''
      const c = ce?.city as { documentId?: string } | undefined
      const cId = c?.documentId != null ? String(c.documentId) : ''
      if (evId && cId === cityId)
        ids.push(evId)
    }
    registeredEventIds.value = ids
  }
  catch (e) {
    console.error('[city] load registrations', e)
    registeredEventIds.value = []
  }
}

const user = await fetchUser()
if (user.value?.documentId) {
  await loadOrCreateDataUser()
  await loadRegistrationsForUser(user.value.documentId)
}

await loadCityEvents()

onActivated(async () => {
  await loadOrCreateDataUser()
  await loadCityEvents()
  const u = await fetchUser()
  if (u.value?.documentId)
    await loadRegistrationsForUser(u.value.documentId)
})

function isRegistered(eventDocumentId: string) {
  return registeredEventIds.value.includes(eventDocumentId)
}

const expandedEventIds = ref<Record<string, boolean>>({})

function hasReadableDescription(desc: string | null) {
  return typeof desc === 'string' && desc.trim().length > 0
}

function toggleEventExpanded(documentId: string) {
  expandedEventIds.value = {
    ...expandedEventIds.value,
    [documentId]: !expandedEventIds.value[documentId],
  }
}

const bookExcursion = async (item: CityEventRow) => {
  const u = await fetchUser()
  if (!u.value?.documentId) {
    statusText.value = 'Войди в аккаунт, чтобы записаться на мероприятие'
    return
  }
  const userId = u.value.documentId
  if (isRegistered(item.documentId)) {
    statusText.value = 'Вы уже записаны на это мероприятие'
    return
  }
  await loadOrCreateDataUser()
  if (exp.value < item.expCost) {
    statusText.value = 'Недостаточно EXP для записи'
    return
  }

  try {
    const dup = await find('city-event-registrations', {
      filters: {
        users_permissions_user: { documentId: { $eq: userId } },
        city_event: { documentId: { $eq: item.documentId } },
      },
      pagination: { pageSize: 1 },
    })
    if ((dup?.data?.length ?? 0) > 0) {
      registeredEventIds.value = [...new Set([...registeredEventIds.value, item.documentId])]
      statusText.value = 'Вы уже записаны на это мероприятие'
      return
    }

    await addExp(-item.expCost)
    try {
      await create('city-event-registrations', {
        city_event: item.documentId,
        users_permissions_user: userId,
        expPaid: item.expCost,
        publishedAt: new Date().toISOString(),
      })
    }
    catch (createErr) {
      try {
        await addExp(item.expCost)
      }
      catch {
        /* возврат EXP не удался — залогируем основную ошибку */
      }
      throw createErr
    }
    registeredEventIds.value = [...registeredEventIds.value, item.documentId]

    // ФОРМАТИРОВАНИЕ ТОЧНОЙ ДАТЫ И ВРЕМЕНИ
    let formattedDate = item.scheduleText || 'Время не указано';
    if (item.startsAt) {
      const d = new Date(item.startsAt);
      formattedDate = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    }

    // ОТПРАВКА УВЕДОМЛЕНИЯ С ДЕТАЛЯМИ И СТРОЙНОЙ АРХИТЕКТУРОЙ Поля NAME
    await pushUserNotification({
      name: 'Мероприятие',
      text: `Запись на «${item.title}» подтверждена.`,
      type: 'success',
      category: 'time', 
      details: {
        title: 'Информация о событии',
        description: item.description || 'Ждем тебя! Не опаздывай.',
        items: [
          `Когда: ${formattedDate}`,
          `Оплачено: ${item.expCost} EXP`
        ]
      }
    })

    statusText.value = 'Запись оформлена! Мероприятие в твоих активностях'
  }
  catch (e) {
    console.error('[city] registration', e)
    statusText.value = 'Не удалось оформить запись. Попробуй ещё раз'
  }
}
</script>

<template>
  <div class="city-page">
    <div class="city-content">
      <header class="city-header">
        <button class="back-btn" type="button" @click="async () => await navigateTo('/general')">
          <ArrowLeft class="back-icon" />
        </button>
        <TwentyText>город</TwentyText>
      </header>

      <section class="city-hero">
        <div class="city-hero-decor" aria-hidden="true">
          <span class="decor-orb decor-orb--one" />
          <span class="decor-orb decor-orb--two" />
          <span class="decor-orb decor-orb--three" />
          <span class="decor-ring decor-ring--one" />
        </div>
        <p class="city-label">городской центр</p>
        <p class="city-name">{{ cityName }}</p>
        <p class="city-desc">Городские мероприятия и экскурсии: запись за EXP с аккаунта.</p>
        <div class="city-stats">
          <p><span>EXP</span><strong>{{ exp }}</strong></p>
        </div>
      </section>

      <section class="excursions-section">
        <div class="action-title-row">
          <CalendarDays class="action-icon" />
          <p class="action-title">мероприятия</p>
        </div>
        <p class="action-text">Выбери событие и запишись за EXP</p>

        <p v-if="eventsLoadError" class="status-text status-text--warn" role="alert">
          {{ eventsLoadError }}
        </p>

        <div v-else-if="cityEvents.length === 0" class="empty-events">
          Пока нет мероприятий для этого города — загляни позже или добавь их в админке Strapi (City event).
        </div>

        <div v-else class="excursions-list">
          <article
            v-for="item in cityEvents"
            :key="item.documentId"
            class="excursion-card"
            :class="{ 'excursion-card--open': expandedEventIds[item.documentId] }"
          >
            <div class="excursion-main">
              <p class="excursion-title">
                {{ item.title }}
              </p>
              <p class="excursion-meta">
                {{ item.scheduleText }}
              </p>
              <span class="excursion-price">{{ item.expCost }} EXP</span>
              <button
                v-if="hasReadableDescription(item.description)"
                type="button"
                class="excursion-toggle"
                :aria-expanded="Boolean(expandedEventIds[item.documentId])"
                @click="toggleEventExpanded(item.documentId)"
              >
                <span>{{ expandedEventIds[item.documentId] ? 'Свернуть' : 'Подробнее' }}</span>
                <ChevronDown class="excursion-chevron" :class="{ 'excursion-chevron--up': expandedEventIds[item.documentId] }" />
              </button>
              <div
                v-show="expandedEventIds[item.documentId] && hasReadableDescription(item.description)"
                class="excursion-detail"
              >
                <p class="excursion-detail-text">
                  {{ item.description }}
                </p>
              </div>
            </div>
            <ButtonAction
              class="excursion-btn"
              :disabled="isRegistered(item.documentId)"
              @click="bookExcursion(item)"
            >
              {{ isRegistered(item.documentId) ? 'записаны' : 'записаться' }}
            </ButtonAction>
          </article>
        </div>
      </section>

      <p v-if="statusText" class="status-text">
        {{ statusText }}
      </p>
    </div>

    <FooterNav />
  </div>
</template>

<style scoped>
.city-page {
  min-height: 100dvh;
  background:
    radial-gradient(circle at 85% 8%, rgba(71, 125, 255, 0.18) 0%, transparent 28%),
    radial-gradient(circle at 10% 70%, rgba(14, 165, 233, 0.14) 0%, transparent 28%),
    #f4f5f7;
}

.city-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 12px 16px 112px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.city-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 2px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.back-icon {
  width: 18px;
  height: 18px;
}

.city-hero {
  position: relative;
  border-radius: 28px;
  background: linear-gradient(145deg, #ffffff 0%, #eef2ff 44%, #f8fafc 100%);
  border: 1px solid #dbe5ff;
  padding: 18px 18px 16px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(71, 125, 255, 0.14);
}

.city-hero-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.decor-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
}

.decor-orb--one {
  width: 132px;
  height: 132px;
  right: -32px;
  top: -40px;
  background: radial-gradient(circle, rgba(71, 125, 255, 0.28) 0%, rgba(71, 125, 255, 0.06) 62%, transparent 72%);
  filter: blur(2px);
}

.decor-orb--two {
  width: 96px;
  height: 96px;
  right: 48px;
  top: -18px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
  filter: blur(1.5px);
}

.decor-orb--three {
  width: 100px;
  height: 100px;
  left: -36px;
  bottom: -28px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.16) 0%, transparent 68%);
  filter: blur(2px);
}

.decor-ring {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  border: 1px solid rgba(71, 125, 255, 0.12);
}

.decor-ring--one {
  width: 140px;
  height: 140px;
  right: 8%;
  bottom: -48px;
  opacity: 0.85;
}

.city-label {
  margin: 0;
  position: relative;
  z-index: 1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 11px;
  color: #64748b;
}

.city-name {
  margin: 0;
  font-family: 'Gothic 60';
  font-size: 24px;
  position: relative;
  z-index: 1;
}

.city-desc {
  margin: 6px 0 0;
  position: relative;
  z-index: 1;
  color: #475569;
  font-size: 13px;
  line-height: 1.32;
}

.city-stats {
  margin-top: 10px;
  position: relative;
  z-index: 1;
}

.city-stats p {
  margin: 0;
  font-size: 12px;
  color: #111827;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e7ecf6;
  padding: 10px 14px;
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

.city-stats span {
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 10px;
}

.city-stats strong {
  font-size: 17px;
  line-height: 1;
  font-family: 'Gothic 60';
}

.excursions-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 26px;
  padding: 16px 16px 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  position: relative;
  overflow: hidden;
}

.excursions-section::before {
  content: '';
  position: absolute;
  width: 160px;
  height: 160px;
  right: -70px;
  top: -70px;
  border-radius: 50%;
  background: rgba(71, 125, 255, 0.08);
  pointer-events: none;
}

.action-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  width: 16px;
  height: 16px;
  color: #3557d6;
}

.action-title {
  margin: 0;
  font-family: 'Gothic 60';
  font-size: 16px;
}

.action-text {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.empty-events {
  margin-top: 12px;
  padding: 14px 12px;
  font-size: 13px;
  line-height: 1.35;
  color: #64748b;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
}

.excursions-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.excursion-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(140deg, #f8fafc 0%, #eef2ff 100%);
  border: 1px solid #dbe4ff;
  border-radius: 22px;
  padding: 14px 14px 14px 16px;
}

.excursion-card--open {
  border-color: #c7d2fe;
  box-shadow: 0 4px 18px rgba(71, 125, 255, 0.12);
}

.excursion-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.excursion-title {
  margin: 0;
  font-family: 'Gothic 60';
  font-size: 15px;
}

.excursion-meta {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.excursion-toggle {
  margin: 8px 0 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #3557d6;
  cursor: pointer;
  text-align: left;
  width: fit-content;
}

.excursion-toggle:hover {
  color: #1d4ed8;
}

.excursion-chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.excursion-chevron--up {
  transform: rotate(-180deg);
}

.excursion-detail {
  margin-top: 10px;
  padding: 12px 12px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #e2e8f0;
}

.excursion-detail-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #334155;
  white-space: pre-wrap;
}

.excursion-price {
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 11px;
  color: #1e3a8a;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
}

.excursion-btn {
  min-width: 108px;
}

:deep(.excursion-btn) {
  box-shadow: 0 6px 14px rgba(71, 125, 255, 0.24);
}

.status-text {
  margin: 0;
  font-size: 13px;
  color: #1e40af;
  background: linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%);
  border: 1px solid #c7d2fe;
  border-radius: 18px;
  padding: 12px 14px;
}

.status-text--warn {
  color: #9a3412;
  background: linear-gradient(160deg, #fff7ed 0%, #ffedd5 100%);
  border-color: #fdba74;
}

@media (max-width: 840px) {
  .excursion-card {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (min-width: 1024px) {
  .city-content {
    padding-bottom: 132px;
  }
}
</style>