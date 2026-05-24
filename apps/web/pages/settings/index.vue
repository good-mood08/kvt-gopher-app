<script setup lang="ts">
import { 
    User, 
    MapPin, 
    Bell, 
    History, 
    HelpCircle, 
    Info, 
    LogOut, 
    ChevronRight ,
    ArrowLeft
} from 'lucide-vue-next'

const { fetchUser,logout } = useStrapiAuth()
const user = await fetchUser()
const { find, findOne } = useStrapi()
const userId = user.value?.documentId
const playerData = usePlayerDataUser()



const map = await find('user-map-stories',{filters:{
    users_permissions_user: { documentId: { $eq: userId } }
}})
const locationComlite = await find('user-location-progresses',{filters:{
    users_permissions_user: { documentId: { $eq: userId } }
}})
const achievementsComplite = await find('user-achievements',{filters:{
    users_permissions_user: { documentId: { $eq: userId } }
}})
const name = user.value?.username!

const mapComplite = ref(0)
const maps = await find('maps',{
    populate:'*'
})

for (const map of maps.data) {
  const mapData = await findOne('maps', map.documentId, { populate: 'locations' })
  const progresses = await find('user-location-progresses', {
    filters: {
      users_permissions_user: { documentId: userId },
      location: { map: { documentId: map.documentId } }
    }
  })
  const locTotal = mapData?.data?.locations?.length ?? 0
  if (locTotal > 0 && Math.round((progresses.data.length / locTotal) * 100) === 100) {
    mapComplite.value++
  }
}

const stats = computed(() => [
  { id: 'locations', number: locationComlite.data.length, label: 'зданий собрано' },
  { id: 'maps-open', number: map.data.length, label: 'карт открыто' },
  { id: 'achievements', number: achievementsComplite.data.length, label: 'достижений собрано' },
  { id: 'maps-done', number: mapComplite.value, label: 'карт пройдено' },
])


const goBack = async () => {

  if (window.history.length > 1) {
    const router = useRouter()
    router.back()
    return
  }

  await navigateTo('/general')
}
</script>

<template>
    <div class="pb-24 ">
            
        <main class="flex flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full mt-2">
            <header class="relative flex items-center min-h-[40px]">
                <button class="relative z-[1] w-[40px] h-[40px] rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] inline-flex items-center justify-center text-[#1f2937] cursor-pointer" type="button" aria-label="Вернуться назад" @click="goBack">
                    <ArrowLeft :stroke-width="2" class="w-[18px] h-[18px]" />
                </button>
                <TwentyText class="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-max max-w-[calc(100%-100px)]">мой аккаунт</TwentyText>
            </header>

        
            <Statistic 
                :stats="stats" 
            />

            <div class="flex flex-col bg-white rounded-[24px] shadow-sm overflow-hidden">
                <NuxtLink to="/settings/profile" data-amplitude-id="menu-personal-data" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <User class="w-6 h-6 text-[#4f7dff]" />
                    <span class="flex-1 text-lg font-medium text-gray-800">Мои данные</span>
                    <ChevronRight class="w-5 h-5 text-gray-400" />
                </NuxtLink>

                <NuxtLink to="/settings/city" data-amplitude-id="menu-city" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <MapPin class="w-6 h-6 text-[#4f7dff]" />
                    <span class="flex-1 text-lg font-medium text-gray-800">Город</span>
                    <span class="text-gray-400 font-medium">Волжский</span> 
                    <ChevronRight class="w-5 h-5 text-gray-400 ml-2" />
                </NuxtLink>
                
                <NuxtLink to="/settings/notifications" data-amplitude-id="menu-notifications" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                    <Bell class="w-6 h-6 text-[#4f7dff]" />
                    <span class="flex-1 text-lg font-medium text-gray-800">Управление уведомлениями</span>
                    <ChevronRight class="w-5 h-5 text-gray-400" />
                </NuxtLink>
            </div>

            <div class="flex flex-col bg-white rounded-[24px] shadow-sm overflow-hidden">
                <!-- <NuxtLink to="/history" data-amplitude-id="menu-history" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <History class="w-6 h-6 text-[#4f7dff]" />
                    <span class="flex-1 text-lg font-medium text-gray-800">История активности</span>
                    <ChevronRight class="w-5 h-5 text-gray-400" />
                </NuxtLink> -->

                <NuxtLink to="/support" data-amplitude-id="menu-support" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <HelpCircle class="w-6 h-6 text-[#4f7dff]" />
                    <span class="flex-1 text-lg font-medium text-gray-800">Нужна помощь</span>
                    <ChevronRight class="w-5 h-5 text-gray-400" />
                </NuxtLink>

                <NuxtLink to="/about" data-amplitude-id="menu-about" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                    <Info class="w-6 h-6 text-[#4f7dff]" />
                    <span class="flex-1 text-lg font-medium text-gray-800">О приложении</span>
                    <ChevronRight class="w-5 h-5 text-gray-400" />
                </NuxtLink>
            </div>

            <div class="flex flex-col bg-white rounded-[24px] shadow-sm overflow-hidden mt-2"  @click="() => {logout(), navigateTo('/')}">
                <button data-amplitude-id="menu-logout" class="flex items-center gap-4 p-5 hover:bg-red-50 transition-colors w-full text-left cursor-pointer">
                    <LogOut class="w-6 h-6 text-red-500" />
                    <span class="flex-1 text-lg font-medium text-red-500">Выйти из аккаунта</span>
                </button>
            </div>

        </main>
    
        <FooterNav />
    </div>
</template>