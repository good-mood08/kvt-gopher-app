<template>
  <div class="chat-container">
    <div class="chat-header">
      <button @click="async () => await navigateTo('/general')" class="round-button">
          <Icon style="font-size: 18px;" name="material-symbols:reply-rounded"/>
      </button>
      <TwentyText>{{ title }}</TwentyText>
      <div class="header-controls">
        <div class="select-root">
          <SelectRoot v-model="timeFilter" class="select-trigger">
            </SelectRoot>
        </div>
        <div class="header-stats" v-if="showStats && unreadCount > 0">
          <span>{{ unreadCount }}</span>
        </div>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <NotificationMessage
        v-for="message in sortedNotifications"
        :key="message.id"
        v-bind="message"
        @click="$emit('messageClick', message)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { startOfToday, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import {
  SelectRoot, SelectTrigger, SelectValue, SelectIcon, SelectPortal,
  SelectContent, SelectViewport, SelectItem, SelectItemText,
} from 'radix-vue';

const props = defineProps({
  title: { type: String, default: 'Уведомления' },
  notifications: { type: Array, required: true, default: () => [] },
  showStats: { type: Boolean, default: true }
});

const emit = defineEmits(['messageClick']);
const messagesContainer = ref(null);
const timeFilter = ref('all');

// Счетчик считаем локально, это ок для UI
const unreadCount = computed(() => {
  return props.notifications.filter(n => !n.read).length;
});

// Фильтрация стала чище, берем готовую дату
const filteredNotifications = computed(() => {
  if (timeFilter.value === 'all') return props.notifications;

  let startDate;
  const now = new Date();
  
  switch (timeFilter.value) {
    case 'today': startDate = startOfToday(); break;
    case 'week': startDate = startOfWeek(now); break;
    case 'month': startDate = startOfMonth(now); break;
    default: return props.notifications;
  }

  return props.notifications.filter(notification => {
    // Дата уже нормализована родителем
    return isAfter(new Date(notification.createdAt), startDate);
  });
});

// Сортировка тоже стала проще
const sortedNotifications = computed(() => {
  return [...filteredNotifications.value].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); 
  });
});

watch(() => sortedNotifications.value.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.round-button {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  position: relative;
  left: -8px;
  transition: all 0.3s ease;
}

.round-button:active {
  transform: scale(0.95);
}

.round-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.select-viewport {
  background-color: #cbd5e1;
  border-radius: 12px;
  width: 100%;
}

.chat-container {
  max-width: 100%;
  margin: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
  animation: fadeIn 0.4s ease;
}

@media (min-width: 641px) {
  .chat-container {
    max-width: 600px;
    margin: auto;
    height: calc(100vh);
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08),
                0 2px 4px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-header {
  gap: 4px;
  padding: 16px 20px;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
}

@media (min-width: 641px) {
  .chat-header {
    padding: 24px 28px;
    gap: 5px;
  }
}

.chat-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.5px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (min-width: 641px) {
  .header-controls {
    gap: 12px;
  }
}

.select-root {
  position: relative;
}

.select-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 0.813rem;
  line-height: 1;
  gap: 6px;
  background-color: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  min-width: 120px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

@media (min-width: 641px) {
  .select-trigger {
    padding: 8px 16px;
    font-size: 0.875rem;
    gap: 8px;
    min-width: 140px;
    border-radius: 12px;
  }
}

.select-trigger:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.select-trigger:focus {
  border-color: #4f7dff;
  box-shadow: 0 0 0 2px rgba(79, 125, 255, 0.1);
}

.select-content {
  overflow: hidden;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  animation: slideDownAndFade 0.2s ease;
}

@media (min-width: 641px) {
  .select-content {
    border-radius: 12px;
  }
}

.select-viewport {
  padding: 6px;
}

@media (min-width: 641px) {
  .select-viewport {
    padding: 8px;
  }
}

.select-item {
  font-size: 0.813rem;
  line-height: 1;
  color: #1e293b;
  padding: 6px 10px;
  border-radius: 6px;
  user-select: none;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

@media (min-width: 641px) {
  .select-item {
    font-size: 0.875rem;
    padding: 8px 12px;
    border-radius: 8px;
  }
}

.select-item:hover {
  background-color: #f8fafc;
}

.select-item[data-highlighted] {
  background-color: #e0f2fe;
  color: #0369a1;
}

@keyframes slideDownAndFade {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-stats {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.04);
}

@media (min-width: 641px) {
  .header-stats {
    font-size: 0.813rem;
    padding: 6px 14px;
    border-radius: 20px;
  }
}

.header-stats:hover {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 641px) {
  .chat-messages {
    padding: 20px 28px;
  }
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

@media (min-width: 641px) {
  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
  transition: background 0.2s ease;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>