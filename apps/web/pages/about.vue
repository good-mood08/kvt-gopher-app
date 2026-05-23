<script setup lang="ts">
import { ArrowLeft, FileText, Shield, Send, Globe } from 'lucide-vue-next'
const router = useRouter()

const appVersion = '1.0.0' // Версия твоего приложения
</script>

<template>
  <div class=" pb-24">
    
    <header class="relative flex items-center min-h-[40px] px-4 md:px-8 mt-6">
      <button class="relative z-[1] w-[40px] h-[40px] rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] inline-flex items-center justify-center text-[#1f2937] cursor-pointer" type="button" @click="router.back()">
        <ArrowLeft :stroke-width="2" class="w-[18px] h-[18px]" />
      </button>
      <TwentyText class="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-max">
        о приложении
      </TwentyText>
    </header>

    <main class="flex flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full mt-4">
      
      <div class="flex flex-col items-center justify-center py-6">
        <div class="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 p-2">
            <img src="/images/suslo.svg" alt="App Logo" class="w-full h-full object-contain">
        </div>
        <h1 class="text-2xl font-bold text-gray-900 font-['Gothic_60']">KVT Gopher</h1>
        <p class="text-gray-400 font-medium mt-1">Версия {{ appVersion }}</p>
        
        <p class="text-center text-gray-500 mt-4 text-[15px] leading-relaxed max-w-[280px]">
          Исследуй город, собирай локации и прокачивай своего суслика!
        </p>
      </div>

      <div class="flex flex-col bg-white rounded-[24px] shadow-sm overflow-hidden">
        <a href="#" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline">
          <Shield class="w-6 h-6 text-gray-400" />
          <span class="flex-1 text-[17px] font-medium text-gray-800">Политика конфиденциальности</span>
        </a>
        <a href="#" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors no-underline">
          <FileText class="w-6 h-6 text-gray-400" />
          <span class="flex-1 text-[17px] font-medium text-gray-800">Пользовательское соглашение</span>
        </a>
      </div>

      <div class="flex flex-col bg-white rounded-[24px] shadow-sm overflow-hidden">
        <a href="https://t.me/твой_канал" target="_blank" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline">
          <Send class="w-6 h-6 text-[#2AABEE]" /> <span class="flex-1 text-[17px] font-medium text-gray-800">Мы в Telegram</span>
        </a>
        <a href="#" target="_blank" class="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors no-underline">
          <Globe class="w-6 h-6 text-[#4f7dff]" />
          <span class="flex-1 text-[17px] font-medium text-gray-800">Сайт проекта</span>
        </a>
      </div>

    </main>
  </div>
</template>