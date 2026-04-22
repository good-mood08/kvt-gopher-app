<template>
    <div class="chat-container">
      <div class="chat-window">
        <div class="chat-header">
          <div class="chat-header-side" aria-hidden="true" />
          <TwelveText class="chat-title">Сюжетный чат</TwelveText>
          <button
            type="button"
            class="header-audio-btn"
            :class="{ 'is-active': ttsAutoOn || ttsPlaying || ttsLoading }"
            title="Автоозвучка: реплики и варианты ответа; следующая реплика после конца фразы. Повторное нажатие — выключить."
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
        
        <div ref="messagesRoot" class="messages-container">
          <div v-for="(message, index) in visibleMessages" :key="index" class="message-container">
            <ChatMessage
              :author="getAuthor(message.authorId).name"
              :message="message.text"
              :is-current-user="getAuthor(message.authorId).name === currentUser"
              :avatar="getAuthor(message.authorId).avatar"
              :image="message.image"
              @image-click="openImageModal"
              @image-load="scrollToBottom"
            />
          </div>
        </div>
        
        <div v-if="currentOptions.length > 0" class="options-container">
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
  
        <div class="next-message-container">
          <TwentyText v-if="footerHint" class="chat-footer-hint">{{ footerHint }}</TwentyText>
          <div v-else class="chat-footer-spacer" aria-hidden="true" />
          <button
            v-show="currentOptions.length === 0"
            type="button"
            class="next-button"
            @click="handleNextButtonClick"
            :disabled="!isFinished && currentMessageIndex >= currentStory.length"
          >
            <TwentyText class="button-action-text">{{ isFinished ? 'Начать игру' : 'Дальше' }}</TwentyText>
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
</template>

<script setup>
const { params } = useRoute()
const locationId = params.id 
const { find, findOne } = useStrapi()


const location = await findOne('locations',locationId , {
  populate:{
    game:{
      fields:'documentId'
    },
    story:true
  }
})


const story = await findOne('stories',location.data.story.documentId,{
  populate:{
    speakers:{
      populate:{
        avatar:{
          fields:'url'
        }
      }
    },
    speaker:true,

  }
})

const isFinished= ref(false)

const currentUser = ref(story.data.speaker.name)
const visibleMessages = ref([])
const currentMessageIndex = ref(0)
const selectedImage = ref(null)
const messagesRoot = ref(null)


const authorsList = story.data.speakers.map((speaker) => ({
    name: speaker.name,
    avatar: useCmsMedia(speaker.avatar?.url),
  }))

const getAuthor = (authorId) => {
  return authorsList.find(author =>  author.name.toLocaleLowerCase() === authorId.toLocaleLowerCase()) || authorsList[0]
}

const buildNarrationScript = (message) => {
  if (!message?.text?.trim()) return ''
  return message.text.trim()
}

const getVoiceForMessage = (message) => {
  if (!message?.authorId) return undefined
  const pub = useRuntimeConfig().public
  const a = String(message.authorId).toLowerCase()
  const me = String(currentUser.value).toLowerCase()
  return a === me ? pub.ttsYandexVoicePlayer : pub.ttsYandexVoiceNpc
}

const storyBranches = new Function(`return ${story.data.content}`)();

const currentStory = ref(storyBranches.main)
const currentOptions = ref([])

const updateIsFinished = () => {
  isFinished.value = currentMessageIndex.value >= currentStory.value.length && currentOptions.value.length === 0
}

const footerHint = computed(() => {
  if (currentOptions.value.length > 0) {
    return 'Выберите один из вариантов — после выбора появится следующая реплика'
  }
  if (isFinished.value) return ''
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
    
    if (message.options) {
      currentOptions.value = message.options
    }

    currentMessageIndex.value++
    scrollToBottom()
    updateIsFinished()
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
    !isFinished.value
    && currentOptions.value.length === 0
    && currentMessageIndex.value < currentStory.value.length,
  advanceStory: () => {
    showNextMessage()
  },
})

watch(isFinished, (v) => {
  if (v) nextTick(() => pauseTtsAutoForStoryEnd())
})

const selectOption = (option) => {
  beforeManualStoryAdvance()
  currentOptions.value = []
  // Показать в ленте выбранный вариант как реплику игрока (от лица speaker)
  const choiceText = typeof option?.text === 'string' ? option.text.trim() : ''
  if (choiceText) {
    visibleMessages.value.push({
      authorId: currentUser.value,
      text: choiceText,
    })
    scrollToBottom()
  }
  currentStory.value = storyBranches[option.branch]
  currentMessageIndex.value = 0
  isFinished.value = false
  showNextMessage() // первая реплика выбранной ветки
}

const handleNextButtonClick = async () => {
  if (isFinished.value) {
    disableTtsAuto()
    await navigateTo(`/locationGame/${locationId}`)
    return
  }
  beforeManualStoryAdvance()
  showNextMessage()
}

const openImageModal = (image) => {
  selectedImage.value = image
  document.body.style.overflow = 'hidden'
}

const closeImageModal = () => {
  selectedImage.value = null
  document.body.style.overflow = 'auto'
}

onMounted(() => {
  showNextMessage()
})

onUnmounted(() => {
  disableTtsAuto()
})
</script>

<style scoped>
@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-container {
  height: 100vh;
  /* background-color: #f3f4f6; */
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.chat-window {
  max-width: 42rem;
  width: 100%;
  height: calc(100vh - 2rem);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  animation: windowAppear 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

@media (max-width: 640px) {
  .chat-container {
    padding: 0;
  }
  
  .chat-window {
    height: 100vh;
    max-width: 100%;
    border-radius: 0;
  }
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  animation: slideDown 0.5s ease-out;
}

.chat-header-side {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.chat-title {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

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

.header-audio-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.header-audio-btn.is-active {
  border-color: rgba(71, 125, 255, 0.45);
  color: rgba(71, 125, 255, 1);
}

.header-audio-icon {
  font-size: 22px;
}

@media (max-width: 640px) {
  .chat-title {
    font-size: 1.25rem;
  }
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
  margin: -0.5rem;
  padding: 0.5rem;
  scroll-behavior: smooth;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #555;
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

.options-container {
  margin-top: 1.5rem;
  animation: slideUp 0.4s ease-out;
}

@media (max-width: 640px) {
  .options-container {
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  }
}

.options-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.option-button {
  width: 100%;
  padding: 0.75rem;
  text-align: left;
  background-color: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.option-button:hover {
  background-color: #e5e7eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.next-message-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  animation: slideUp 0.5s ease-out;
}

@media (max-width: 640px) {
  .next-message-container {
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  }
}

.next-button {
  flex-shrink: 0;
  padding: 0.65rem 1.25rem;
  background-color: rgba(71, 125, 255, 1);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.next-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.next-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background-color: rgba(217, 217, 217, 1);
  border-radius: 8px;
  padding: 8px;
}

.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: rgba(217, 217, 217, 1);
  font-size: 2rem;
  cursor: pointer;
  padding: 8px;
  transition: transform 0.3s ease;
}

.modal-close:hover {
  transform: rotate(90deg);
}

.modal-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 4px;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Additional animations */
@keyframes windowAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .modal-content {
    width: 95vw;
    margin: 16px;
  }
  
  .modal-close {
    top: -36px;
    right: -8px;
  }
}
</style>