<script setup lang="ts">
import { ArrowLeft, MessageCircle, Mail, ChevronDown } from 'lucide-vue-next'

const router = useRouter()

const faqs = ref([
  {
    label: 'Как получить новые вещи для суслика?',
    content: 'Уникальные элементы гардероба выдаются за открытие зданий на карте, полное прохождение экскурсий и сбор достижений. Чем больше ты исследуешь город, тем больше стильных образов доступно твоему суслику!',
    isOpen: false
  },
  {
    label: 'Как работают экскурсии?',
    content: 'Экскурсии — это специальные маршруты по интересным местам города. Следуй по точкам на карте, узнавай историю зданий и получай увеличенный опыт (EXP) и редкие вещи для суслика за полное прохождение маршрута!',
    isOpen: false
  },
  {
    label: 'Здание на карте не собирается. Что делать?',
    content: 'Убедись, что ты подошел достаточно близко к нужной точке. Проверь, включен ли GPS на телефоне и разрешен ли доступ к геолокации для твоего браузера. Иногда нужно подождать пару секунд, чтобы координаты обновились.',
    isOpen: false
  },
  {
    label: 'Для чего нужны очки опыта (EXP)?',
    content: 'Опыт показывает твой уровень исследователя. Ты получаешь его за каждую найденную локацию, выполненное достижение и пройденную экскурсию. Прокачивай аккаунт, чтобы выделяться среди других игроков!',
    isOpen: false
  },
  {
    label: 'Как сменить свой город?',
    content: 'Зайди в раздел "Мои данные" (или "Город") через настройки профиля. Там ты сможешь выбрать нужный город из списка, и карта с экскурсиями автоматически обновится для твоего региона.',
    isOpen: false
  }
])

const toggleFaq = (index: number) => {
    faqs.value[index].isOpen = !faqs.value[index].isOpen
}


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
    <div class="min-h-screen bg-white flex flex-col font-['Gothic_60'] tracking-wide text-black uppercase">
        
        <header class="px-6 py-6 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 border-none">
            <button class="relative z-[1] w-[40px] h-[40px] rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] inline-flex items-center justify-center text-[#1f2937] cursor-pointer" type="button" aria-label="Вернуться назад" @click="goBack">
                    <ArrowLeft :stroke-width="2" class="w-[18px] h-[18px]" />
            </button>
             
            <TwentyText class="text-[18px] tracking-widest">нужна помощь</TwentyText>
            <div class="w-[40px]"></div>
        </header>

        <main class="flex-1 px-6 pt-4 pb-12 max-w-md mx-auto w-full flex flex-col gap-10">
            
            <div class="flex flex-col gap-4">
                <span class="text-[11px] text-black/50 ml-1 tracking-widest block">Частые вопросы</span>
                
                <div class="flex flex-col gap-3">
                    <div 
                        v-for="(faq, index) in faqs" 
                        :key="index" 
                        class="flex flex-col rounded-[16px] overflow-hidden transition-all duration-300"
                        :class="faq.isOpen ? 'bg-[#F8F9FB]' : 'bg-[#F1F3F4]'"
                    >
                        <button 
                            @click="toggleFaq(index)"
                            class="w-full min-h-[56px] px-5 py-3 flex items-center justify-between text-left transition-colors active:bg-[#E8F0FE]"
                            :class="faq.isOpen ? 'text-[#1A73E8]' : 'text-black'"
                        >
                            <span class="text-[12px] font-['Gothic_60'] tracking-widest pr-4 leading-snug">
                                {{ faq.label }}
                            </span>
                            <ChevronDown 
                                class="w-5 h-5 shrink-0 transition-transform duration-300"
                                :class="faq.isOpen ? 'rotate-180 text-[#1A73E8]' : 'text-black/30'" 
                            />
                        </button>
                        
                        <div 
                            v-show="faq.isOpen" 
                            class="px-5 pb-5 text-[12px] text-black/60 leading-relaxed normal-case tracking-normal border-t border-black/5 mx-5 pt-3 mt-1"
                        >
                            {{ faq.content }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-4 mt-auto pt-6">
                <span class="text-[11px] text-black/50 ml-1 tracking-widest block text-center">Не нашел ответ? Напиши нам</span>
                
                <div class="flex flex-col gap-3">
                    <a 
                        href="https://t.me/твоя_ссылка" 
                        target="_blank"
                        class="w-full h-[56px] rounded-[16px] bg-[#E8F0FE] text-[#1A73E8] text-[13px] tracking-widest flex items-center justify-center gap-3 active:bg-[#D2E3FC] transition-colors no-underline"
                    >
                        <MessageCircle class="w-5 h-5" stroke-width="1.5" />
                        <span>Написать в Telegram</span>
                    </a>

                    <a 
                        href="mailto:support@example.com" 
                        class="w-full h-[56px] rounded-[16px] bg-[#F1F3F4] text-black text-[13px] tracking-widest flex items-center justify-center gap-3 hover:bg-[#E8F0FE] hover:text-[#1A73E8] active:bg-[#e4e6e7] transition-colors no-underline"
                    >
                        <Mail class="w-5 h-5" stroke-width="1.5" />
                        <span>Отправить Email</span>
                    </a>
                </div>
            </div>

        </main>
    </div>
</template>