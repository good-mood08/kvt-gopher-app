<template>
    <div>
      <NotificationChat 
        title="Системные уведомления"
        :notifications="notifications"
        :show-stats="true"
        :unread-count="unreadCount"
        @message-click="handleMessageClick"
      />
    </div>
  </template>
  <script setup lang="ts">
  import { getData, setData } from '~/composables/useLocalStore'
  const { find, create, findOne } = useStrapi()
  const {  fetchUser } = useStrapiAuth()
  const user = await fetchUser()
  const userId = user.value?.documentId

  const UserNotigication = await find('user-notigications',{
    populate:{
      iconUrl:{
        fields:'url'
      }
    },
    filters:{
      users_permissions_user: { documentId: { $eq: userId } }
    }
  })
  const CityNotigication = await find('sity-notifications',{
    populate:{
      iconUrl:{
        fields:'url'
      }
    },
    filters:{
      city: { documentId: { $eq: getData('cityId') }}
    }
  })


  const notifications = ref([...UserNotigication.data, ...CityNotigication.data ])

async function isRead(id){
  const { find, create, findOne } = useStrapi()
  const {  fetchUser } = useStrapiAuth()
  const user = await fetchUser()
  const userId = user.value?.documentId
  const Userexisting = await find('read-notigications', {
  filters: {
    users_permissions_user: { documentId: { $eq: userId } },
    user_notigication: { documentId: { $eq: id } },
    },
  })
  const Cityexisting = await find('read-notigications', {
  filters: {
    users_permissions_user: { documentId: { $eq: userId } },
    sity_notification: { documentId: { $eq: id } },
    },
  })

  if (Userexisting?.data?.length > 0) {

    return true
  }
  if (Cityexisting?.data?.length > 0) {
    return true
  }
    return false

}
processItems()



// Обрабатываем массив
async function processItems() {
  const updatedItems = await Promise.all(
    notifications.value.map(async (item) => ({
      ...item,
      read: await isRead(item.documentId),
    }))
  );
  notifications.value = updatedItems;

  
}

  // const notifications = ref([
  //   {
  //     id: 1,
  //     type: 'info',
  //     text: 'Добро пожаловать в центр уведомлений!',
  //     timestamp: new Date('2025-05-03T10:05:00'),
  //     priority: 'low',
  //     read: false,
  //     category: 'system',
  //     iconUrl: '/images/blue.png',
  //     details: {
  //       title: 'Руководство по началу работы',
  //       description: 'Добро пожаловать в центр уведомлений',
  //       items: [
  //         'Регулярно проверяйте уведомления',
  //         'Нажмите, чтобы отметить как прочитанное',
  //         'Используйте фильтры для организации уведомлений'
  //       ]
  //     }
  //   },
  //   {
  //     id: 2,
  //     type: 'success',
  //     text: 'Ваш профиль успешно обновлен.',
  //     timestamp: new Date('2024-04-03T10:00:00'),
  //     priority: 'medium',
  //     read: true,
  //     category: 'profile',
  //     iconUrl: '/images/purpur.png',
  //     details: {
  //       title: 'Сводка обновления профиля',
  //       items: [
  //         'Информация профиля обновлена',
  //         'Настройки безопасности изменены',
  //         'Предпочтения сохранены'
  //       ]
  //     }
  //   },
  //   {
  //     id: 3,
  //     type: 'warning',
  //     text: 'Пожалуйста, подтвердите ваш email адрес.',
  //     timestamp: new Date('2024-04-03T10:10:00'),
  //     priority: 'high',
  //     read: false,
  //     category: 'security',
  //     iconUrl: '/images/blue.png',
  //     details: {
  //       title: 'Требуется подтверждение email',
  //       description: 'Для повышения безопасности требуется подтверждение email',
  //       items: [
  //         'Проверьте вашу почту',
  //         'Нажмите на ссылку подтверждения',
  //         'Подтвердите вашу личность'
  //       ]
  //     }
  //   },
  //   {
  //     id: 4,
  //     type: 'error',
  //     text: 'Не удалось подключиться к серверу.',
  //     timestamp: new Date('2024-05-03T10:15:00'),
  //     priority: 'critical',
  //     read: false,
  //     category: 'system',
  //     iconUrl: '/images/purpur.png',
  //     details: {
  //       title: 'Ошибка подключения',
  //       description: 'Не удалось установить соединение с сервером',
  //       items: [
  //         'Таймаут соединения через 30 секунд',
  //         'Сервер не отвечает',
  //         'Статус сети: нестабильный'
  //       ]
  //     }
  //   }
  // ]);
  
  const unreadCount = computed(() => {
    return notifications.value.filter(notification => !notification.read).length;
  });
  
  async function handleMessageClick(message) {
  const { find, create, findOne } = useStrapi()
  const {  fetchUser } = useStrapiAuth()
  const user = await fetchUser()
  const userId = user.value?.documentId
  // console.log('Сообщение нажато:', message);
  if (!message.read) {
    try{
      const Userexisting = await create('read-notigications', {
        users_permissions_user:userId,
        user_notigication:message.documentId,
      })

    }catch(err){
      
      // console.log('ошибка создания записи о уведомления по пользователю',err);
    }
    try{
      const Cityexisting = await create('read-notigications', {
        users_permissions_user: userId,
        sity_notification: message.documentId,
      })
    }catch(err){
      
      // console.log('ошибка создания записи о уведомления по городу',err);
    }
  }
  message.read = true
};
  </script>
  
  <style scoped>
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: #f8fafc;
    color: #1e293b;
  }
  
  * {
    box-sizing: border-box;
  }
  </style>