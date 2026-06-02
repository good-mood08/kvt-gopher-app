<template>
  <div class="message" :class="[typeClass, { 'unread': !read }]">
    <div class="message-content" :class="priorityClass">
      <div class="message-header">
        <div class="message-icon" :class="typeClass">
          <img :src="iconSrc" :alt="typeClass" />
        </div>
        <div class="message-meta">
          <span class="message-category"><TwentyText>{{ categoryName }}</TwentyText></span>
          <div class="message-time"><TwelveText>{{ formattedDate }}</TwelveText></div>
        </div>
      </div>
      <div class="message-text"><TwelveText>{{ text }}</TwelveText></div>
      <div class="message-footer">
        <div class="message-priority" :class="priorityClass">
          <TenText>{{ priorityName }}</TenText>
        </div>
        
        <div v-if="hasDetails" class="message-details" @click.stop="toggleDetails">
          <TwelveText>{{ isDetailsOpen ? 'Скрыть детали' : 'Показать детали' }} →</TwelveText>  
        </div>
      </div>

      <div v-if="hasDetails && isDetailsOpen" class="details-panel">
        <div v-if="details.title" class="details-title"><TwelveText>{{ details.title }}</TwelveText></div>
        <div v-if="details.description" class="details-description">
          <TenText>{{ details.description }}</TenText>
        </div>
        <div v-if="details.items && details.items.length > 0" class="details-items">
          <ul>
            <li v-for="(item, index) in details.items" :key="index">
              <TwelveText>{{ item }}</TwelveText> 
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { format } from 'date-fns';

const props = defineProps({
  text: { type: String, default: '' },
  createdAt: { type: [Date, String], default: () => new Date() },
  updatedAt: { type: [Date, String], default: () => new Date() },
  read: { type: Boolean, default: false },
  iconUrl: { type: [String, Object], default: '' },

  // Пропсы, которые генерирует наш Маппер
  typeClass: { type: String, default: 'info' },      // warning, success...
  priorityClass: { type: String, default: 'low' },   // low, high...
  categoryName: { type: String, default: 'Система' },// Русское слово
  priorityName: { type: String, default: 'Низкий' }, // Русское слово
  details: { type: Object, default: () => ({}) },    // Готовый объект
})

function iconUrlToPath(icon: unknown): string {
  if (typeof icon === 'string') return icon
  if (icon && typeof icon === 'object' && 'url' in icon) return String((icon as { url: string }).url)
  return ''
}

const iconSrc = computed(() => useCmsMedia(iconUrlToPath(props.iconUrl)))
const isDetailsOpen = ref(false);

const toggleDetails = () => {
  isDetailsOpen.value = !isDetailsOpen.value;
};

// Проверяем, есть ли реальные данные для панели (без парсинга!)
const hasDetails = computed(() => {
  if (!props.details) return false;
  return !!(props.details.title || props.details.description || (props.details.items && props.details.items.length > 0));
});

const formattedDate = computed(() => {
  const dateVal = props.createdAt || props.updatedAt;
  if (!dateVal) return '';
  return format(new Date(dateVal), 'HH:mm, d MMM');
});
</script>

<style scoped>
.message {
  margin: 8px 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  opacity: 0;
  animation: slideIn 0.3s ease forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.message:hover {
  transform: translateX(6px);
}

.message:active {
  transform: translateX(8px) scale(0.98);
}

.message-content {
  padding: 20px;
  border-radius: 16px;
  background: white;
  position: relative;
  max-width: 90%;
  margin-left: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05),0 4px 16px rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.message.unread .message-content::before {
  content: '';
  position: absolute;
  top: 20px;
  right: 20px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4f7dff;
}

.message:hover .message-content {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08),0 8px 24px rgba(0, 0, 0, 0.04);
}

.message.info .message-content { border-left: 4px solid #4f7dff; }
.message.success .message-content { border-left: 4px solid #22c55e; }
.message.warning .message-content { border-left: 4px solid #eab308; }
.message.error .message-content { border-left: 4px solid #ef4444; }

.message-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.message-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-category {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
}

.message-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.message:hover .message-icon {
  transform: scale(1.1) rotate(-4deg);
}

.message-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info .message-icon { border: 2px solid #4f7dff; }
.success .message-icon { border: 2px solid #22c55e; }
.warning .message-icon { border: 2px solid #eab308; }
.error .message-icon { border: 2px solid #ef4444; }

.message-time {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: -0.2px;
  transition: color 0.2s ease;
}

.message:hover .message-time {
  color: #64748b;
}

.message-text {
  color: #334155;
  line-height: 1.6;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.1px;
  margin-bottom: 16px;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.message-priority {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-priority.low { 
  background: #f1f5f9;
  color: #64748b;
}

.message-priority.medium { 
  background: #e0f2fe;
  color: #0369a1;
}

.message-priority.high { 
  background: #fef3c7;
  color: #92400e;
}

.message-priority.critical { 
  background: #fee2e2;
  color: #b91c1c;
}

.message-details {
  font-size: 13px;
  font-weight: 500;
  color: #4f7dff;
  transition: all 0.3s ease;
  cursor: pointer;
}

.message:hover .message-details {
  color: #1d4ed8;
  transform: translateX(4px);
  transition: all 0.3s ease;
}

.details-panel {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  animation: fadeIn 0.3s ease;
}

.details-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.details-description {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
  line-height: 1.6;
}

.details-items ul {
  margin: 8px 0;
  padding-left: 20px;
  list-style-type: disc;
}

.details-items li {
  color: #334155;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 6px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>