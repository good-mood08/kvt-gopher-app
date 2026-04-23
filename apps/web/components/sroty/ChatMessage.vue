<template>
    <div :class="['message-wrapper', { 'current-user': isCurrentUser }]">
      <img :src="avatar" :alt="author" class="avatar" />
      <div class="message-content">
        <div class="message-bubble">
          <TwelveText class="author-name">{{ author }}</TwelveText>
          <TwelveText class="message-text">{{ message }}</TwelveText>
          <img 
            v-if="image" 
            :src="image" 
            :alt="message" 
            class="message-image" 
            @click="$emit('imageClick', image)"
            @load="$emit('imageLoad')"
          />
        </div>
      </div>
    </div>
</template>

<script setup>
defineProps({
  /**
   * кто говорит
   */
  author: {
    type: String,
    required: true
  },
  /**
   * текст сообщения
   */
  message: {
    type: String,
    required: true
  },
  /**
   * является ли он тем от чьего лица мы общаемся
   * @default false
   */
  isCurrentUser: {
    type: Boolean,
    default: false
  },
  /**
   * аватар говорящего
   */
  avatar: {
    type: String,
    required: true
  },
  /**
   * url картинки прикреплённой к сообщению
   * @default ""
   */
  image: {
    type: String,
    default: ''
  }
})

defineEmits(['imageClick', 'imageLoad'])
</script>

<style scoped>
.messages-container {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
}

@media (max-width: 640px) {
  .messages-container {
    flex: 1;
    min-height: 0;
    max-height: none;
    margin: -1.5rem;
    margin-top: 0;
    margin-bottom: 0;
    border-radius: 0;
  }
}

.message-container {
  animation: messageAppear 0.5s ease-out forwards;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  flex-shrink: 0;
  animation: avatarPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.message-wrapper {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
  opacity: 0;
  transform: translateY(20px);
  animation: slideIn 0.5s ease forwards;
}

.message-wrapper.current-user {
  flex-direction: row-reverse;
}

.message-content {
  margin: 0 10px;
  max-width: 74%;
}

@media (max-width: 640px) {
  .message-content {
    max-width: 85%;
  }

  .message-bubble {
    padding: 8px !important;
  }
}

.message-bubble {
  padding: 12px 13px;
  border-radius: 14px;
  position: relative;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  word-wrap: break-word;
  overflow-wrap: break-word;
  transform-origin: left center;
  animation: bubbleExpand 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
}

.message-bubble::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  top: 10px;
}

.message-wrapper:not(.current-user) .message-bubble {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.message-wrapper.current-user .message-bubble {
  background: linear-gradient(135deg, #4f7dff, #6366f1);
  color: white;
  transform-origin: right center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.message-wrapper:not(.current-user) .message-bubble::before {
  border-right-color: #f1f5f9;
  left: -15px;
}

.message-wrapper.current-user .message-bubble::before {
  border-left-color: #586ffb;
  right: -15px;
}

.author-name {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards 0.2s;
}

.message-text {
  margin-bottom: 0.75rem;
  line-height: 1.45;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards 0.3s;
}

.message-image {
  max-width: 100%;
  border-radius: 10px;
  display: block;
  margin-top: 8px;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards 0.4s;
}

.message-image:hover {
  transform: scale(1.03);
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bubbleExpand {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes avatarPop {
  from {
    transform: scale(0.5);
  }
  to {
    transform: scale(1);
  }
}
</style>