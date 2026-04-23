<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    showNotificationDot?: boolean
  }>(),
  {
    showNotificationDot: false
  }
)

const route = useRoute()

const onTabClick = async (path: string) => {
  await navigateTo(path)
}
</script>

<template>
  <nav class="fixed inset-x-0 bottom-[env(safe-area-inset-bottom)] z-40 flex justify-center px-0 pb-0 md:bottom-6 md:px-4 md:pb-0">
    <div class="w-full max-w-none min-h-[70px] rounded-none bg-[#EAEAEA] px-6 pb-2 pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.14)] md:max-w-[760px] md:min-h-[80px] md:rounded-[30px] md:px-7 md:py-4">
      <ul class="grid h-full grid-cols-4 items-center gap-3 md:h-full md:items-center md:gap-5">
        <li>
          <button @click="onTabClick('/general')" class="relative flex w-full flex-col items-center justify-center px-1.5 py-1.5 md:py-2">
            <Smartphone
              :stroke-width="1.7"
              class="h-[28px] w-[28px]"
              :class="route.path.startsWith('/general') ? 'stroke-[#D33030]' : 'stroke-black'"
            />
            <span
              class="px-2 py-0.5 text-[15px] leading-none md:text-[13px]"
              :class="route.path.startsWith('/general') ? 'text-[#D33030] border-[#D33030]' : 'text-black border-transparent'"
            >
              телефон
            </span>
            <span
              v-if="showNotificationDot"
              class="absolute right-[18%] top-0 h-2.5 w-2.5 rounded-full bg-[#FF4B4B]"
            />
          </button>
        </li>

        <li>
          <button @click="onTabClick('/shop')" class="flex w-full flex-col items-center justify-center px-1.5 py-1.5 md:py-2">
            <ShoppingBag
              :stroke-width="1.7"
              class="h-[28px] w-[27px]"
              :class="route.path.startsWith('/shop') ? 'stroke-[#D33030]' : 'stroke-black'"
            />
            <span
              class="px-2 py-0.5 text-[15px] leading-none md:text-[13px]"
              :class="route.path.startsWith('/shop') ? 'text-[#D33030] border-[#D33030]' : 'text-black border-transparent'"
            >
              магазин
            </span>
          </button>
        </li>

        <li>
          <button @click="onTabClick('/rating')" class="flex w-full flex-col items-center justify-center px-1.5 py-1.5 md:py-2">
            <Trophy
              :stroke-width="1.7"
              class="h-[25px] w-[27px]"
              :class="route.path.startsWith('/rating') ? 'stroke-[#D33030]' : 'stroke-black'"
            />
            <span
              class="px-2 py-0.5 text-[15px] leading-none md:text-[13px]"
              :class="route.path.startsWith('/rating') ? 'text-[#D33030] border-[#D33030]' : 'text-black border-transparent'"
            >
              рейтинг
            </span>
          </button>
        </li>

        <li>
          <button @click="onTabClick('/profile')" class="flex w-full flex-col items-center justify-center px-1.5 py-1.5 md:py-2">
            <Settings
              :stroke-width="1.7"
              class="h-[27px] w-[27px]"
              :class="route.path.startsWith('/profile') ? 'stroke-[#D33030]' : 'stroke-black'"
            />
            <span
              class="px-2 py-0.5 text-[15px] leading-none md:text-[13px]"
              :class="route.path.startsWith('/profile') ? 'text-[#D33030] border-[#D33030]' : 'text-black border-transparent'"
            >
              настройки
            </span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>
