<script setup lang="ts">
import { ArrowLeft, Trash2, Check, Lock } from 'lucide-vue-next'
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const { fetchUser, logout } = useStrapiAuth()
const strapiClient = useStrapiClient()
const router = useRouter()

const user = await fetchUser()

// Оставляем в реактивном стейте формы только то, что можно менять
const state = reactive({
    username: user.value?.username || ''
})

// Убираем email из валидации, так как мы его больше не редактируем
const schema = z.object({
    username: z.string()
        .min(3, 'МИНИМУМ 3 СИМВОЛА')
        .max(16, 'МАКСИМУМ 16 СИМВОЛОВ')
        .regex(/^[a-zA-Zа-яА-ЯёЁ0-9_]+$/, 'ТОЛЬКО БУКВЫ, ЦИФРЫ И "_"')
})

type Schema = z.output<typeof schema>

const isSaving = ref(false)
const isDeleting = ref(false)
const confirmDelete = ref(false)
const globalStatus = ref({ text: '', type: '' })

const saveChanges = async (event: FormSubmitEvent<Schema>) => {
    if (!user.value?.id) return
    isSaving.value = true
    globalStatus.value = { text: '', type: '' }

    try {
        await strapiClient(`/users/${user.value.id}`, {
            method: 'PUT',
            // Отправляем ТОЛЬКО имя, почту сервер не трогает
            body: {
                username: event.data.username
            }
        })
        await fetchUser()
        globalStatus.value = { text: 'ДАННЫЕ УСПЕШНО ОБНОВЛЕНЫ', type: 'success' }
        setTimeout(() => router.back(), 1000)
    } catch (e: any) {
        globalStatus.value = { text: 'НЕ УДАЛОСЬ СОХРАНИТЬ ДАННЫЕ', type: 'error' }
    } finally {
        isSaving.value = false
    }
}

const handleDeleteAccount = async () => {
    if (!user.value?.id) return
    if (!confirmDelete.value) {
        confirmDelete.value = true
        return
    }
    isDeleting.value = true
    try {
        await strapiClient(`/users/${user.value.id}`, { method: 'DELETE' })
        logout()
        await navigateTo('/')
    } catch (e) {
        logout()
        await navigateTo('/')
    } finally {
        isDeleting.value = false
    }
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
    <div class="min-h-screen bg-[#F8F9FB] flex flex-col justify-between pb-10">
        
        <div>
            <header class="bg-white px-4 py-4 flex items-center justify-between border-b border-black/5 shrink-0 sticky top-0 z-10">
                <button class="relative z-[1] w-[40px] h-[40px] rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] inline-flex items-center justify-center text-[#1f2937] cursor-pointer" type="button" aria-label="Вернуться назад" @click="goBack">
                    <ArrowLeft :stroke-width="2" class="w-[18px] h-[18px]" />
                </button>
                <TwentyText class="text-[20px]">мои данные</TwentyText>
                <div class="w-[44px]"></div>
            </header>

            <main class="p-5 max-w-xl mx-auto w-full pt-8">
                <UForm 
                    :schema="schema" 
                    :state="state" 
                    :validate-on="['input', 'blur']"
                    @submit="saveChanges" 
                    class="flex flex-col gap-8"
                >
                    <div class="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col gap-5">
                        
                        <UFormField name="username" :ui="{ error: 'text-[#b42318] font-[\'Gothic_60\'] text-[10px] uppercase tracking-wider mt-1.5 ml-4' }">
                            <template #label>
                                <span class="font-['Gothic_60'] text-[11px] uppercase text-black/40 ml-4 tracking-widest block mb-1.5">Твое имя</span>
                            </template>
                            <input 
                                v-model="state.username"
                                type="text"
                                placeholder="ВВЕДИ ИМЯ"
                                class="w-full h-[60px] px-6 rounded-[20px] bg-[#F4F5F7] border border-transparent focus:bg-white focus:border-[#477DFF] focus:ring-4 focus:ring-[#477DFF]/10 transition-all duration-200 font-['Gothic_60'] text-[14px] text-black uppercase tracking-wider outline-none placeholder:text-black/20"
                            />
                        </UFormField>

                        <div class="flex flex-col">
                            <span class="font-['Gothic_60'] text-[11px] uppercase text-black/40 ml-4 tracking-widest block mb-1.5 flex items-center gap-1.5">
                                Твой Email <Lock class="w-3 h-3 opacity-50" />
                            </span>
                            <input 
                                :value="user?.email"
                                type="email"
                                disabled
                                class="w-full h-[60px] px-6 rounded-[20px] bg-[#F4F5F7]/60 border border-transparent font-['Gothic_60'] text-[14px] text-black/40 uppercase tracking-wider outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <Transition name="fade">
                        <p v-if="globalStatus.text" :class="globalStatus.type === 'success' ? 'text-[#059669]' : 'text-[#b42318]'" class="text-center font-['Gothic_60'] text-[12px] uppercase tracking-wide px-4 -mt-2">
                            {{ globalStatus.text }}
                        </p>
                    </Transition>

                    <button 
                        type="submit" 
                        :disabled="isSaving" 
                        class="w-full h-[60px] rounded-[24px] bg-[#477DFF] text-white font-['Gothic_60'] text-[15px] uppercase tracking-[1px] flex items-center justify-center shadow-[0_10px_25px_rgba(71,125,255,0.25)] hover:shadow-[0_10px_25px_rgba(71,125,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                        <span v-if="!isSaving" class="flex items-center gap-2">
                            сохранить изменения 
                        </span>
                        <span v-else class="flex items-center gap-2">
                            сохраняем...
                        </span>
                    </button>
                </UForm>
            </main>
        </div>

        <footer class="p-5 max-w-xl mx-auto w-full mb-4">
            <button 
                @click="handleDeleteAccount" 
                @mouseleave="confirmDelete = false" 
                :disabled="isDeleting" 
                :class="[confirmDelete ? 'bg-[#b42318] text-white shadow-[0_10px_20px_rgba(180,35,24,0.15)]' : 'bg-transparent border border-[#b42318]/30 text-[#b42318] hover:bg-[#b42318]/5']" 
                class="w-full h-[60px] rounded-[24px] font-['Gothic_60'] text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]" 
                type="button"
            >
                <Trash2 class="w-4 h-4" />
                <span>{{ confirmDelete ? 'ТОЧНО УДАЛИТЬ?' : 'удалить аккаунт' }}</span>
            </button>
        </footer>

    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>