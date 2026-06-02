<template>
  <div>
    <NotificationChat 
      title="Системные уведомления"
      :notifications="mappedNotifications"
      :show-stats="true"
      @message-click="handleMessageClick"
    />
  </div>
</template>

<script setup lang="ts">
import { getData } from '~/composables/useLocalStore'

const { find, create } = useStrapi()
const { fetchUser } = useStrapiAuth()

const user = await fetchUser()
const userId = user.value?.documentId || user.value?.DOCUMENTID 
const cityId = getData('cityId')

const normalizeNotification = (item: any, readIds: Set<string>) => {
  const docId = item.documentId || item.DOCUMENTID;
  const cat = item.category || item.CATEGORY || {};

  let parsedDetails = null;
  const rawDetails = item.details || item.DETAILS;
  if (rawDetails) {
    try {
      parsedDetails = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : rawDetails;
    } catch (e) { console.error('Ошибка парсинга details', e) }
  }

  const rawPriority = item.priority || item.PRIORITY || 'low';
  const priorityName = { low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический' }[rawPriority.toLowerCase()] || rawPriority;

  return {
    ...item,
    id: docId,
    documentId: docId,
    read: readIds.has(docId),
    
    iconUrl: cat.icon?.url || cat.ICON?.url || '/images/default.png',
    createdAt: item.createdAt || item.CREATEDAT || item.publishedAt || item.PUBLISHEDAT,
    
    categoryName: item.name || item.NAME || 'Уведомление',
    priorityName: priorityName,
    priorityClass: rawPriority.toLowerCase(),
    typeClass: item.type || item.TYPE || 'info',
    
    details: parsedDetails 
  };
};

const mappedNotifications = ref([])

// Запрос данных
const [allNotifs, readReceipts] = await Promise.all([
  find('notifications', {
    // Подтягиваем категорию, а из неё иконку
    populate: { category: { populate: { icon: { fields: 'url' } } } },
    filters: {
      $or: [
        { target_user: { documentId: { $eq: userId } } },
        { target_city: { documentId: { $eq: cityId } } },
        { target_type: { $eq: 'global' } } 
      ]
    }
  }),
  find('notification-reads', {
    populate: ['notification'],
    filters: { users_permissions_user: { documentId: { $eq: userId } } }
  })
])

// Собираем ID прочитанных уведомлений
const readIds = new Set(readReceipts.data.map((r: any) => {
  const n = r.notification || r.NOTIFICATION;
  return n?.documentId || n?.DOCUMENTID;
}))

mappedNotifications.value = (allNotifs.data || []).map(item => normalizeNotification(item, readIds))

async function handleMessageClick(message: any) {
  if (message.read) return
  message.read = true; 
  try {
    await create('notification-reads', {
      users_permissions_user: { connect: [userId] },
      notification: { connect: [message.documentId] }
    })
  } catch (err) {
    message.read = false; 
    console.error('Ошибка при отметке уведомления как прочитанного', err)
  }
}
</script>

<style scoped>
body { 
  margin: 0; 
  background-color: #f8fafc; 
}
* { 
  box-sizing: border-box; 
}
</style>