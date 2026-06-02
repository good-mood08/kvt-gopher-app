type UserNotificationType = 'warning' | 'error' | 'success' | 'info'
type UserNotificationPriority = 'low' | 'medium' | 'high' | 'critical'
type UserNotificationCategory = 'security' | 'profile' | 'system' | 'user' | 'payment' | 'achievement' | 'time'

export function usePushUserNotification() {
  const { create, find } = useStrapi()
  const { fetchUser } = useStrapiAuth()

  async function pushUserNotification(options: {
    text: string
    name: string 
    category?: UserNotificationCategory 
    type?: UserNotificationType
    priority?: UserNotificationPriority
    details?: Record<string, any>
  }) {
    try {
      const user = await fetchUser()
      const userId = user.value?.documentId || user.value?.DOCUMENTID 
      if (!userId) return

      let categoryId = null;

      if (options.category) {
        try {
          const catRes = await find('notification-categories', {
            filters: { name: { $eq: options.category } }
          }) as any;
          const foundCat = catRes?.data?.[0];
          categoryId = foundCat?.documentId || foundCat?.DOCUMENTID;
        } catch (e) { /* игнорим */ }
      }

      const payload: Record<string, any> = {
        text: options.text,
        name: options.name, // Прямая запись твоего текста
        type: options.type ?? 'success',
        priority: options.priority ?? 'low',
        target_type: 'user', 
        target_user: { connect: [userId] }, 
        publishedAt: new Date().toISOString(),
      }

      if (options.details && Object.keys(options.details).length > 0) {
        payload.details = options.details
      }

      if (categoryId) {
        payload.category = { connect: [categoryId] }
      }

      const res = await create('notifications', payload) as { error?: any }
      if (res?.error) console.warn('Ошибка API', res.error)
    }
    catch (err) {
      console.warn('Не удалось создать уведомление', err)
    }
  }

  return { pushUserNotification }
}