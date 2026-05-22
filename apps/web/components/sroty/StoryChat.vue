<template>
  <Transition name="slide">
    <div v-if="isOpen" class="chat-container">
      <div class="chat-window">
        <div class="chat-header">
          <button
            type="button"
            data-tour="map-story-chat-help"
            class="header-help-btn"
            aria-label="Открыть обучение чату"
            @click="openChatTutorial"
          >
            <Icon class="header-help-icon" name="material-symbols:help-rounded" />
          </button>
          <TwelveText class="chat-title">Сюжетный чат</TwelveText>
          <button
            type="button"
            data-tour="map-story-chat-audio"
            class="header-audio-btn"
            :class="{ 'is-active': ttsAutoOn || ttsPlaying || ttsLoading }"
            title="Автоозвучка: следующая реплика появляется после конца фразы. Повторное нажатие — выключить."
            :aria-label="ttsAutoOn ? 'Выключить автоозвучку' : 'Включить автоозвучку с автопереходом'"
            @click="onAudioToggle"
          >
            <Icon
              class="header-audio-icon"
              :class="{ 'animate-spin': ttsLoading }"
              :name="ttsLoading ? 'material-symbols:progress-activity' : ttsPlaying ? 'material-symbols:stop-circle' : 'material-symbols:volume-up-rounded'"
            />
          </button>
        </div>
        
        <div ref="messagesRoot" class="messages-container" data-tour="map-story-chat-messages">
          <div v-for="(message, index) in visibleMessages" :key="index" class="message-container">
            <ChatMessage
              :author="getAuthor(message.authorId).name"
              :message="message.text ?? ''"
              :is-current-user="getAuthor(message.authorId).name === currentUser"
              :avatar="getAuthor(message.authorId).avatar"
              :image="message.image"
              @image-click="openImageModal"
              @image-load="scrollToBottom"
            />
          </div>
        </div>

        <div v-if="currentOptions.length > 0" class="options-container" data-tour="map-story-chat-options">
          <TwentyText class="options-title">Выберите ответ</TwentyText>
          <button
            v-for="(option, index) in currentOptions"
            :key="index"
            type="button"
            class="option-button"
            @click="selectOption(option)"
          >
            <TwelveText>{{ option.text }}</TwelveText>
          </button>
        </div>

        <div class="next-message-container" data-tour="map-story-chat-next">
          <TwentyText v-if="footerHint" class="chat-footer-hint">{{ footerHint }}</TwentyText>
          <div v-else class="chat-footer-spacer" aria-hidden="true" />
          <button
            v-show="currentOptions.length === 0"
            type="button"
            class="next-button"
            @click="handleNextButtonClick"
            :disabled="!isFinished && currentMessageIndex >= currentStory.length"
          >
            <TwentyText class="button-action-text">{{ isFinished ? 'Закрыть' : 'Дальше' }}</TwentyText>
          </button>
        </div>
      </div>

      <!-- Image Modal -->
      <Transition name="modal">
        <div v-if="selectedImage" class="modal" @click="closeImageModal">
          <div class="modal-content" @click.stop>
            <button class="modal-close" @click="closeImageModal">&times;</button>
            <img :src="selectedImage" alt="Full size image" class="modal-image" />
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>

const props = defineProps({
  /**
   * открывался ли чат до этого
   */
  isOpen: {
      type: Boolean,
      required: true
  },
  /**
   * обьект сообщений чата
   */
  story: {
      type: Object,
      required: true
  },
  /**
   * массив говорящих
   */
  speakers: {
      type: Array,
      required: true
  },
  /**
   * от чьего лици ведётся диалог
   */
  currentUser: {
      type: String,
      required: true
  },
  /**
   * был ли просмотрен диалог
   */
  hasSeenDialog:{
      type: Boolean,
      required: true
  },
  /**
   * id записи истории в базе данных
   */
  mapStoryId:{
      type: String,
      required:true
  }
})
  
const { find, create, findOne } = useStrapi()
const emit = defineEmits(['close'])

const hasSeenDialog = ref(props.hasSeenDialog)
// console.log(hasSeenDialog.value);

const CHAT_TOUR_STORAGE_KEY = 'map-story-chat-driver-tour-seen-v4'
const { startQuestTour, stopQuestTour } = useQuestOnboardingTour()
let chatTourStartTimer = null

const clearChatTourStartTimer = () => {
  if (!chatTourStartTimer)
    return

  window.clearTimeout(chatTourStartTimer)
  chatTourStartTimer = null
}

const chatTourSteps = [
  {
    element: '[data-tour="map-story-chat-messages"]',
    popover: {
      title: 'Сюжетный чат',
      description: 'Здесь появляются реплики персонажей. Читайте их по порядку, чтобы понять завязку карты.',
      side: 'over',
      align: 'center',
    },
  },
  {
    element: '[data-tour="map-story-chat-next"]',
    popover: {
      title: 'Продолжение истории',
      description: 'Нажимайте "Дальше", когда готовы открыть следующую реплику. Когда история закончится, кнопка закроет чат.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="map-story-chat-options"]',
    popover: {
      title: 'Выбор ответа',
      description: 'Если появятся варианты, выберите один ответ. После этого сюжет продолжится по выбранной ветке.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="map-story-chat-audio"]',
    popover: {
      title: 'Озвучка',
      description: 'Динамик включает автоозвучку. Следующая реплика появится после окончания фразы.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    popover: {
      title: 'После чата',
      description: 'Закройте историю, и обучение карты продолжится: оно покажет, как выбирать точки и проходить задания.',
    },
  },
]

const isFinished = ref(false)

const visibleMessages = ref([])
const currentMessageIndex = ref(0)
const currentStory = ref([])
const currentOptions = ref([])
const selectedImage = ref(null)
const messagesRoot = ref(null)

/** Полный сюжет с ветками из `story.content` (объект API, JSON или JS-литерал из админки). */
function getStoryBranches() {
  return parseStoryBranchesContent(props.story?.content)
}

function resetStorySession() {
  const b = getStoryBranches()
  currentStory.value = Array.isArray(b.main) ? b.main : []
  currentMessageIndex.value = 0
  currentOptions.value = []
  visibleMessages.value = []
  isFinished.value = false
}

const updateIsFinished = () => {
  const done =
    currentMessageIndex.value >= currentStory.value.length && currentOptions.value.length === 0
  isFinished.value = done
  if (done) {
    hasSeenDialog.value = true
  }
}

/** Уже просмотрено: показываем только ветку main целиком (путь ветвления в БД не хранится). */
function replaySeenStory() {
  const b = getStoryBranches()
  const main = Array.isArray(b.main) ? b.main : []
  visibleMessages.value = [...main]
  currentStory.value = main
  currentMessageIndex.value = main.length
  currentOptions.value = []
  if (main.length) {
    isFinished.value = true
  } else {
    updateIsFinished()
  }
  nextTick(() => scrollToBottom())
}


watch(isFinished, async(newValue) => {
  const {  fetchUser } = useStrapiAuth()
  
  if (newValue) { 
    try {
      const user = await fetchUser()
      const userId = user.value?.documentId
      const existing = await find('user-map-stories', {
      filters: {
        users_permissions_user: { documentId: { $eq: userId } },
        map_story: { documentId: { $eq: props.mapStoryId } },
        },
      })

      if (existing?.data?.length > 0) {
        return
      }
          
      await create('user-map-stories', {
        users_permissions_user: userId,
        map_story: props.mapStoryId,
      })
      
    }catch (err) {
        console.error('Ошибка при создании прогресса:', err)
        alert('Произошла ошибка')
    }
  }
  
});

const authorsList = computed(() => props.speakers.map((speaker) => ({
  name: speaker.name,
  avatar: useCmsMedia(speaker.avatar?.url),
})))

const getAuthor = (authorId) => {
  if (authorId == null || authorId === '') return authorsList.value[0]
  const id = String(authorId).toLowerCase()
  return authorsList.value.find(author => author.name.toLocaleLowerCase() === id) || authorsList.value[0]
}

/** Только текст для TTS — персонажи различаются голосами (public.ttsYandexVoice*) */
const buildNarrationScript = (message) => {
  if (!message?.text?.trim()) return ''
  return message.text.trim()
}

const getVoiceForMessage = (message) => {
  if (!message?.authorId) return undefined
  const pub = useRuntimeConfig().public
  const a = String(message.authorId).toLowerCase()
  const me = String(props.currentUser).toLowerCase()
  return a === me ? pub.ttsYandexVoicePlayer : pub.ttsYandexVoiceNpc
}

const footerHint = computed(() => {
  if (currentOptions.value.length > 0) {
    return 'Выберите один из вариантов — после выбора пойдёт выбранная ветка сюжета'
  }
  if (hasSeenDialog.value || isFinished.value) return ''
  const total = currentStory.value.length
  if (total === 0) return ''
  return `Реплика ${currentMessageIndex.value} из ${total} · нажмите «Дальше», когда будете готовы`
})

const scrollToBottom = () => {
  nextTick(() => {
    const el = messagesRoot.value
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  })
}

const showNextMessage = () => {
  if (currentMessageIndex.value < currentStory.value.length) {
    const message = currentStory.value[currentMessageIndex.value]
    visibleMessages.value.push(message)

    if (message.options && Array.isArray(message.options) && message.options.length > 0) {
      currentOptions.value = message.options
    } else {
      currentOptions.value = []
    }

    currentMessageIndex.value++
    scrollToBottom()
    updateIsFinished()
  }
}

const selectOption = (option) => {
  beforeManualStoryAdvance()
  currentOptions.value = []
  const choiceText = typeof option?.text === 'string' ? option.text.trim() : ''
  if (choiceText) {
    visibleMessages.value.push({
      authorId: props.currentUser,
      text: choiceText,
    })
    scrollToBottom()
  }
  const b = getStoryBranches()
  const branchKey = option?.branch != null ? String(option.branch) : ''
  const nextBranch = branchKey ? b[branchKey] : null
  currentStory.value = Array.isArray(nextBranch) ? nextBranch : []
  currentMessageIndex.value = 0
  isFinished.value = false
  updateIsFinished()
  if (!isFinished.value) {
    showNextMessage()
  }
}

const {
  ttsAutoOn,
  ttsLoading,
  ttsPlaying,
  disableTtsAuto,
  pauseTtsAutoForStoryEnd,
  beforeManualStoryAdvance,
  onAudioToggle,
} = useStoryChatTts({
  visibleMessages,
  buildNarrationScript,
  getVoiceForMessage,
  onTtsError: (msg) => {
    alert(typeof msg === 'string' ? msg : 'Не удалось получить озвучку')
  },
  getCurrentOptions: () => currentOptions.value,
  canAdvanceStory: () =>
    !hasSeenDialog.value
    && !isFinished.value
    && currentOptions.value.length === 0
    && currentMessageIndex.value < currentStory.value.length,
  advanceStory: () => {
    showNextMessage()
  },
})

watch(isFinished, (v) => {
  if (v) nextTick(() => pauseTtsAutoForStoryEnd())
})

const handleNextButtonClick = () => {
  if (isFinished.value) {
    close()
    return
  }
  beforeManualStoryAdvance()
  showNextMessage()
}

const close = () => {
  clearChatTourStartTimer()
  disableTtsAuto()
  stopQuestTour(true)
  emit('close')
}

const startChatTour = async (force = false) => {
  if (!props.isOpen)
    return

  await startQuestTour({
    storageKey: CHAT_TOUR_STORAGE_KEY,
    steps: chatTourSteps,
    force,
    waitFor: ['[data-tour="map-story-chat-messages"]', '[data-tour="map-story-chat-next"]'],
  })
}

const openChatTutorial = async () => {
  await startChatTour(true)
}

const openImageModal = (image) => {
  selectedImage.value = image
  document.body.style.overflow = 'hidden'
}

const closeImageModal = () => {
  selectedImage.value = null
  document.body.style.overflow = 'auto'
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    disableTtsAuto()
    document.body.style.overflow = 'hidden'
    if (!hasSeenDialog.value) {
      resetStorySession()
      if (currentStory.value.length > 0) {
        showNextMessage()
      } else {
        updateIsFinished()
      }
    } else if (visibleMessages.value.length === 0) {
      replaySeenStory()
    }

    clearChatTourStartTimer()
    chatTourStartTimer = window.setTimeout(() => {
      chatTourStartTimer = null
      void startChatTour()
    }, 650)
  } else {
    clearChatTourStartTimer()
    document.body.style.overflow = 'auto'
    disableTtsAuto()
  }
})

onUnmounted(() => {
  clearChatTourStartTimer()
  disableTtsAuto()
  document.body.style.overflow = 'auto'
})
</script>

<style scoped>
.chat-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(80% 60% at 20% 10%, rgba(96, 165, 250, 0.2), transparent 60%),
    radial-gradient(70% 50% at 90% 90%, rgba(99, 102, 241, 0.2), transparent 60%),
    rgba(9, 12, 24, 0.56);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.chat-window {
  width: 100%;
  max-width: 42rem;
  height: calc(100vh - 2rem);
  margin: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 255, 0.98) 100%);
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.26);
  box-shadow: 0 24px 60px rgba(16, 24, 40, 0.28);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(245, 248, 255, 0.96) 100%);
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

.chat-title {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.header-help-btn,
.header-audio-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.header-help-btn:hover,
.header-audio-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.header-audio-btn.is-active {
  border-color: rgba(79, 125, 255, 0.45);
  color: rgba(79, 125, 255, 1);
}

.header-help-icon,
.header-audio-icon {
  font-size: 22px;
}



.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  -webkit-overflow-scrolling: touch;
  background:
    radial-gradient(55rem 20rem at -10% -20%, rgba(147, 197, 253, 0.14), transparent 52%),
    radial-gradient(55rem 20rem at 110% 120%, rgba(196, 181, 253, 0.12), transparent 52%),
    rgba(248, 250, 255, 0.7);
}

.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.options-container {
  padding: 0 1rem 0.75rem;
  animation: story-slide-up 0.4s ease-out;
}

.options-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.65rem;
}

.option-button {
  width: 100%;
  padding: 0.75rem;
  text-align: left;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.option-button:hover {
  background: linear-gradient(180deg, #fff, rgba(236, 242, 255, 1));
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
}

@keyframes story-slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.next-message-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(247, 250, 255, 0.95) 100%);
  border-top: 1px solid rgba(148, 163, 184, 0.24);
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
}

.chat-footer-hint {
  flex: 1;
  min-width: 0;
  font-size: 0.6875rem;
  line-height: 1.3;
  color: #6b7280;
}

.chat-footer-spacer {
  flex: 1;
  min-width: 0;
}

.next-button {
  flex-shrink: 0;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, rgba(79, 125, 255, 1), rgba(95, 103, 247, 1));
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.next-button:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 10px 24px rgba(79, 125, 255, 0.35);
}

.next-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 2001;
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

@media (max-width: 640px) {
  .chat-window {
    margin: 0.5rem;
    height: calc(100vh - 1rem);
  }

  .chat-header {
    padding: 0.75rem 1rem;
  }

  .messages-container {
    padding: 0.75rem;
  }

  .next-message-container {
    padding: 0.75rem 1rem;
  }

  .next-button {
    padding: 0.5rem 1rem;
  }

  .modal-close {
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>
