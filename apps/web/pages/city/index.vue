<script setup lang="ts">
import { ArrowLeft, CalendarDays } from 'lucide-vue-next'
import { getData, setData } from '~/composables/useLocalStore'

const { findOne } = useStrapi()

const cityId = getData<string>('cityId')
const city = ref<any>(null)

if (cityId) {
  city.value = await findOne('cities', cityId)
}

const cityName = computed(() => city.value?.data?.name || 'ваш город')

const COINS_KEY = 'cityCoins'
const BOOKINGS_KEY = 'cityBookings'

const getNumber = (key: string, fallback = 0) => {
  const value = getData<number>(key)
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const coins = ref(getNumber(COINS_KEY, 250))
const bookings = ref<string[]>(getData<string[]>(BOOKINGS_KEY) || [])
const statusText = ref('')

const excursions = [
  { id: 'hist-center', title: 'Исторический центр', date: 'Сб, 14:00', coinsRequired: 80 },
  { id: 'night-river', title: 'Ночная набережная', date: 'Вс, 19:30', coinsRequired: 120 },
  { id: 'hidden-yards', title: 'Тайные дворики', date: 'Пт, 18:00', coinsRequired: 150 },
]

const persist = () => {
  setData(COINS_KEY, coins.value, 30, 'd')
  setData(BOOKINGS_KEY, bookings.value, 30, 'd')
}

const bookExcursion = (excursionId: string, coinsRequired: number) => {
  if (bookings.value.includes(excursionId)) {
    statusText.value = 'Вы уже записаны на эту экскурсию'
    return
  }
  if (coins.value < coinsRequired) {
    statusText.value = 'Недостаточно валюты для записи'
    return
  }
  coins.value -= coinsRequired
  bookings.value = [...bookings.value, excursionId]
  persist()
  statusText.value = 'Запись оформлена! Экскурсия добавлена в ваши активности'
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
        </div>
        <p class="city-label">городской центр</p>
        <p class="city-name">{{ cityName }}</p>
        <p class="city-desc">Эксклюзивные городские экскурсии доступны только в этом разделе.</p>
        <div class="city-stats">
          <p><span>валюта</span><strong>{{ coins }}</strong></p>
        </div>
      </section>

      <section class="excursions-section">
        <div class="action-title-row">
          <CalendarDays class="action-icon" />
          <p class="action-title">эксклюзивные экскурсии</p>
        </div>
        <p class="action-text">Выбирай маршрут и записывайся за городскую валюту</p>

        <div class="excursions-list">
          <article v-for="item in excursions" :key="item.id" class="excursion-card">
            <div class="excursion-main">
              <p class="excursion-title">{{ item.title }}</p>
              <p class="excursion-meta">{{ item.date }}</p>
              <span class="excursion-price">{{ item.coinsRequired }} валюты</span>
            </div>
            <ButtonAction
              class="excursion-btn"
              :disabled="bookings.includes(item.id)"
              @click="bookExcursion(item.id, item.coinsRequired)"
            >
              {{ bookings.includes(item.id) ? 'записаны' : 'записаться' }}
            </ButtonAction>
          </article>
        </div>
      </section>

      <p v-if="statusText" class="status-text">{{ statusText }}</p>
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
  gap: 12px;
}

.city-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 2px;
}

.back-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  width: 18px;
  height: 18px;
}

.city-hero {
  position: relative;
  border-radius: 18px;
  background: linear-gradient(145deg, #ffffff 0%, #eef2ff 44%, #f8fafc 100%);
  border: 1px solid #dbe5ff;
  padding: 14px 14px 12px;
  overflow: hidden;
  box-shadow: 0 10px 26px rgba(71, 125, 255, 0.12);
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
  width: 120px;
  height: 120px;
  right: -26px;
  top: -34px;
  background: rgba(71, 125, 255, 0.18);
}

.decor-orb--two {
  width: 88px;
  height: 88px;
  right: 44px;
  top: -16px;
  background: rgba(99, 102, 241, 0.12);
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
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #e7ecf6;
  padding: 8px 10px;
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
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
  border-radius: 18px;
  padding: 12px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
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

.excursions-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.excursion-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: linear-gradient(140deg, #f8fafc 0%, #eef2ff 100%);
  border: 1px solid #dbe4ff;
  border-radius: 14px;
  padding: 12px;
}

.excursion-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  border-radius: 12px;
  padding: 10px 12px;
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
