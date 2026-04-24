<script setup lang="ts">
import { House, Settings, ShoppingBag, Trophy } from 'lucide-vue-next'

const route = useRoute()
const activeTab = ref('главная')

const getTabByPath = (path: string) => {
  if (path.startsWith('/shop')) return 'магазин'
  if (path.startsWith('/rating')) return 'рейтинг'
  if (path.startsWith('/profile') || path.startsWith('/achivments')) return 'профиль'
  return 'главная'
}

const onTabClick = async (tab: string, path: string) => {
  activeTab.value = tab
  await navigateTo(path)
}

watch(
  () => route.path,
  (path) => {
    activeTab.value = getTabByPath(path)
  },
  { immediate: true },
)
</script>

<template>
  <nav class="footer-nav">
    <div class="footer-shell">
      <ul class="footer-grid">
        <li>
          <button class="footer-btn" @click="onTabClick('главная', '/general')">
            <House :stroke-width="1.7" class="footer-icon" :class="activeTab === 'главная' ? 'stroke-[#D33030]' : 'stroke-black'" />
            <span :class="activeTab === 'главная' ? 'text-[#D33030]' : 'text-black'">главная</span>
          </button>
        </li>
        <li>
          <button class="footer-btn" @click="onTabClick('магазин', '/shop')">
            <ShoppingBag :stroke-width="1.7" class="footer-icon" :class="activeTab === 'магазин' ? 'stroke-[#D33030]' : 'stroke-black'" />
            <span :class="activeTab === 'магазин' ? 'text-[#D33030]' : 'text-black'">магазин</span>
          </button>
        </li>
        <li>
          <button class="footer-btn" @click="onTabClick('рейтинг', '/rating')">
            <Trophy :stroke-width="1.7" class="footer-icon" :class="activeTab === 'рейтинг' ? 'stroke-[#D33030]' : 'stroke-black'" />
            <span :class="activeTab === 'рейтинг' ? 'text-[#D33030]' : 'text-black'">рейтинг</span>
          </button>
        </li>
        <li>
          <button class="footer-btn" @click="onTabClick('профиль', '/profile')">
            <Settings :stroke-width="1.7" class="footer-icon" :class="activeTab === 'профиль' ? 'stroke-[#D33030]' : 'stroke-black'" />
            <span :class="activeTab === 'профиль' ? 'text-[#D33030]' : 'text-black'">профиль</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.footer-nav {
  position: fixed;
  inset-inline: 0;
  bottom: env(safe-area-inset-bottom);
  z-index: 40;
  display: flex;
  justify-content: center;
  padding: 0;
}

.footer-shell {
  width: 100%;
  min-height: 70px;
  background: #eaeaea;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.14);
  padding: 8px 14px 10px;
}

.footer-grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: 6px;
}

.footer-btn {
  width: 100%;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.footer-icon {
  width: 26px;
  height: 26px;
}

.footer-btn span {
  font-size: 12px;
  line-height: 1.1;
}

@media (min-width: 1024px) {
  .footer-nav {
    bottom: 24px;
    padding-inline: 16px;
  }

  .footer-shell {
    max-width: 760px;
    min-height: 78px;
    border-radius: 24px;
    padding: 10px 18px;
  }
}
</style>
