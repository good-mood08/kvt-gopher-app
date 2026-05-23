<script setup lang="ts">
import { Map, ArrowLeft, Home } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps({
  error: Object
})

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    clearError({ redirect: '/general' })
  }
}

const goHome = () => {
  clearError({ redirect: '/general' })
}
</script>

<template>
  <div class="h-[100dvh] bg-[#F5F5F5] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden font-['Gothic_60',sans-serif]">
    
    <div class="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col items-center text-center max-w-sm w-full gap-4">
      
      <div class="flex items-center justify-center text-7xl font-black text-gray-900 tracking-tighter drop-shadow-sm">
        <span>4</span>
        <div class="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-2 border border-gray-100">
          <Map class="w-8 h-8 text-orange-500" stroke-width="1.5" />
        </div>
        <span>4</span>
      </div>

      <img src="/images/suslo.svg" alt="Заблудившийся суслик" class="w-32 h-auto drop-shadow-md -mt-2" />

      <div class="flex flex-col gap-2 mt-1">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 m-0">Локация не найдена</h1>
        <p class="text-gray-500 text-[14px] leading-snug px-2 m-0 text-balance">
          Похоже, суслик забрел куда-то не туда. Такой страницы нет на нашей карте, но впереди еще много интересного!
        </p>
      </div>

      <div class="flex flex-col w-full gap-3 mt-3">
        <button 
          @click="goBack" 
          class="w-full bg-[#4f7dff] hover:bg-[#3f64cc] text-white text-[16px] py-[14px] px-6 rounded-[20px] transition-colors flex items-center justify-center gap-3 shadow-sm border-none cursor-pointer m-0"
        >
          <ArrowLeft class="w-5 h-5" />
          Вернуться назад
        </button>
        
        <button 
          @click="goHome" 
          class="w-full bg-white hover:bg-gray-50 text-gray-800 text-[16px] py-[14px] px-6 rounded-[20px] transition-colors border border-gray-100 flex items-center justify-center gap-3 shadow-sm cursor-pointer m-0"
        >
          <Home class="w-5 h-5 text-gray-400" />
          На главную
        </button>
      </div>

    </div>
  </div>
</template>