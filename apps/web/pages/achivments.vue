<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

type CatalogAchievement = {
  documentId: string
  title: string
  description: string
}

type DisplayAchievementRow = {
  rowKey: string
  catalogAchievementDocumentId: string
  userAchievementDocumentId: string | null
  collected: boolean
  title: string
  description: string
  locked: boolean
}

type AchFilter = 'all' | 'pending' | 'done'

function normalizeCatalogAchievement(raw: Record<string, unknown>): CatalogAchievement | null {
  const documentId = raw.documentId != null ? String(raw.documentId) : ''
  if (!documentId)
    return null
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title)
    return null
  const description = typeof raw.description === 'string' ? raw.description : ''
  return { documentId, title, description }
}

const { fetchUser } = useStrapiAuth()
const user = await fetchUser()
const userId = user.value?.documentId ?? ''
const name = computed(() => user.value?.username ?? 'игрок')
const { find } = useStrapi()

const achievementRows = ref<DisplayAchievementRow[]>([])

if (userId) {
  const [achRes, uaRes] = await Promise.all([
    find('achievements', {
      pagination: { pageSize: 200 },
      sort: ['title:asc'],
      filters: { publishedAt: { $notNull: true } },
    }),
    find('user-achievements', {
      filters: {
        users_permissions_user: { documentId: { $eq: userId } },
      },
      populate: { achievement: { fields: ['documentId'] } },
    }),
  ])

  const catalog = ((achRes?.data ?? []) as Array<Record<string, unknown>>)
    .map(normalizeCatalogAchievement)
    .filter((a): a is CatalogAchievement => a != null)

  const byAchievementDoc = new Map<string, { uaDocId: string, collected: boolean }>()
  for (const row of (uaRes?.data ?? []) as Array<Record<string, unknown>>) {
    const uaDocId = row.documentId != null ? String(row.documentId) : ''
    const ach = row.achievement as { documentId?: string } | undefined
    const achDoc = ach?.documentId != null ? String(ach.documentId) : ''
    if (!uaDocId || !achDoc)
      continue
    byAchievementDoc.set(achDoc, {
      uaDocId,
      collected: Boolean(row.collected),
    })
  }

  achievementRows.value = catalog.map((a) => {
    const link = byAchievementDoc.get(a.documentId)
    const locked = !link
    return {
      rowKey: link?.uaDocId ?? `catalog:${a.documentId}`,
      catalogAchievementDocumentId: a.documentId,
      userAchievementDocumentId: link?.uaDocId ?? null,
      collected: link?.collected ?? false,
      title: a.title,
      description: a.description,
      locked,
    }
  })
}

const activeFilter = ref<AchFilter>('all')

const filteredRows = computed(() => {
  const list = achievementRows.value
  if (activeFilter.value === 'pending')
    return list.filter(r => !r.locked && !r.collected)
  if (activeFilter.value === 'done')
    return list.filter(r => r.collected)
  return list
})

const totalCount = computed(() => achievementRows.value.length)
const collectedCount = computed(() => achievementRows.value.filter(r => r.collected).length)
const progressPercent = computed(() =>
  totalCount.value === 0 ? 0 : Math.round((collectedCount.value / totalCount.value) * 100),
)

const pendingCount = computed(() =>
  achievementRows.value.filter(r => !r.locked && !r.collected).length,
)

function onAchievementCollected(userAchievementDocumentId: string) {
  const row = achievementRows.value.find(
    r => r.userAchievementDocumentId === userAchievementDocumentId,
  )
  if (row)
    row.collected = true
}

const filterTabs: { id: AchFilter, label: string }[] = [
  { id: 'all', label: 'все' },
  { id: 'pending', label: 'можно забрать' },
  { id: 'done', label: 'собрано' },
]
</script>

<template>
  <div class="achievements-page">
    <TheHeader :username="name" />

    <div class="achievements-body">
      <header class="page-head">
        <NuxtLink to="/profile" class="back-link" aria-label="Назад в профиль">
          <ArrowLeft :stroke-width="2" class="back-icon" />
        </NuxtLink>
        <div class="page-head-text">
          <TwentyText class="page-title">достижения</TwentyText>
          <p class="page-sub">
            собирай награды и смотри прогресс коллекции
          </p>
        </div>
      </header>

      <section v-if="!userId" class="empty-panel">
        <p class="empty-title">нужен вход</p>
        <p class="empty-text">авторизуйся, чтобы увидеть свои достижения.</p>
        <NuxtLink class="empty-cta" to="/">на главную</NuxtLink>
      </section>

      <template v-else>
        <section class="summary-card" aria-label="Прогресс по достижениям">
          <div class="summary-top">
            <div class="summary-numbers">
              <span class="summary-big">{{ collectedCount }}</span>
              <span class="summary-sep">/</span>
              <span class="summary-total">{{ totalCount }}</span>
            </div>
            <span class="summary-label">собрано</span>
          </div>
          <div class="progress-track" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
          </div>
          <p class="summary-foot">
            {{ progressPercent }}% коллекции
            <span v-if="pendingCount > 0" class="summary-pending">· можно забрать: {{ pendingCount }}</span>
          </p>
        </section>

        <div class="filter-row" role="tablist" aria-label="Фильтр достижений">
          <button
            v-for="tab in filterTabs"
            :key="tab.id"
            type="button"
            role="tab"
            class="filter-tab"
            :class="{ 'filter-tab--active': activeFilter === tab.id }"
            :aria-selected="activeFilter === tab.id"
            @click="activeFilter = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="totalCount === 0" class="empty-panel empty-panel--soft">
          <p class="empty-title">пока пусто</p>
          <p class="empty-text">
            в Strapi ещё нет опубликованных достижений (Achievement) — добавь их в админке.
          </p>
        </div>

        <div v-else-if="filteredRows.length === 0" class="empty-panel empty-panel--soft">
          <p class="empty-title">ничего не найдено</p>
          <p class="empty-text">в этом фильтре сейчас нет карточек.</p>
        </div>

        <div v-else class="achievements-grid">
          <ProfileAchievementCard
            v-for="row in filteredRows"
            :key="row.rowKey"
            :id="row.userAchievementDocumentId ?? row.catalogAchievementDocumentId"
            :locked="row.locked"
            :collected="row.collected"
            :description="row.description"
            :title="row.title"
            @collected="onAchievementCollected"
          />
        </div>
      </template>
    </div>

    <FooterNav />
  </div>
</template>

<style scoped>
.achievements-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #f2f2f3;
}

.achievements-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 4vw, 22px);
  padding: clamp(12px, 3vw, 18px) clamp(14px, 4vw, 22px) 110px;
  max-width: 560px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.page-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.back-link {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-top: 2px;
  border-radius: 12px;
  background: #e4e4e6;
  color: #1a1a1c;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.back-link:hover {
  background: #d8d8db;
}

.back-icon {
  width: 22px;
  height: 22px;
}

.page-head-text {
  min-width: 0;
  flex: 1;
}

.page-title {
  display: block;
  margin-bottom: 4px;
}

.page-sub {
  margin: 0;
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(12px, 3.2vw, 14px);
  line-height: 1.25;
  color: #6a6a6e;
}

.summary-card {
  background: #fff;
  border-radius: clamp(16px, 4vw, 22px);
  padding: clamp(16px, 4vw, 20px);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.summary-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.summary-numbers {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-family: 'Gothic 60', sans-serif;
  color: #111;
}

.summary-big {
  font-size: clamp(32px, 9vw, 40px);
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.summary-sep {
  font-size: clamp(22px, 6vw, 28px);
  color: #b0b0b5;
  line-height: 1;
}

.summary-total {
  font-size: clamp(22px, 6vw, 28px);
  line-height: 1;
  color: #5c5c62;
}

.summary-label {
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(13px, 3.4vw, 15px);
  color: #7a7a80;
  text-transform: lowercase;
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  background: #ececee;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #5d86f5 0%, #477dff 100%);
  transition: width 0.35s ease;
}

.summary-foot {
  margin: 10px 0 0;
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(12px, 3.1vw, 13px);
  color: #6f6f74;
  line-height: 1.3;
}

.summary-pending {
  color: #477dff;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tab {
  flex: 1 1 auto;
  min-width: 0;
  padding: 10px 12px;
  border: none;
  border-radius: 14px;
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(12px, 3.2vw, 14px);
  line-height: 1.1;
  text-transform: lowercase;
  cursor: pointer;
  background: #e8e8ea;
  color: #3d3d42;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.filter-tab:hover {
  background: #dedee2;
}

.filter-tab--active {
  background: #111;
  color: #fafafa;
  box-shadow: 0 4px 14px rgba(17, 17, 17, 0.18);
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.empty-panel {
  text-align: center;
  padding: clamp(24px, 6vw, 36px) clamp(16px, 4vw, 24px);
  border-radius: clamp(16px, 4vw, 22px);
  background: #fff;
  border: 1px dashed #c8c8ce;
}

.empty-panel--soft {
  background: #fafafa;
  border-style: solid;
  border-color: #e4e4e8;
}

.empty-title {
  margin: 0 0 8px;
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(16px, 4.2vw, 18px);
  color: #1a1a1c;
  text-transform: lowercase;
}

.empty-text {
  margin: 0 0 16px;
  font-family: 'Gothic 60', sans-serif;
  font-size: clamp(12px, 3.2vw, 14px);
  line-height: 1.35;
  color: #6a6a70;
}

.empty-text:last-child {
  margin-bottom: 0;
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 14px;
  background: #477dff;
  color: #fff;
  font-family: 'Gothic 60', sans-serif;
  font-size: 14px;
  text-decoration: none;
  text-transform: lowercase;
  transition: opacity 0.15s ease;
}

.empty-cta:hover {
  opacity: 0.9;
}

@media (max-width: 380px) {
  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .filter-tab {
    flex: 1 1 calc(50% - 4px);
  }
}
</style>
