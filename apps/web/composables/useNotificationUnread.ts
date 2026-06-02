import { ref } from 'vue'
import { getData } from '~/composables/useLocalStore'

export function useNotificationUnread() {
  const hasUnread = ref(false)

  async function refresh() {
    try {
      const { find } = useStrapi()
      const { fetchUser } = useStrapiAuth()
      hasUnread.value = false

      const user = await fetchUser()
      const userId = user.value?.documentId || user.value?.DOCUMENTID
      if (!userId) return

      const cityId = getData('cityId')

      // Делаем запросы к НОВЫМ таблицам
      const [allNotifs, readReceipts] = await Promise.all([
        find('notifications', {
          filters: {
            $or: [
              { target_user: { documentId: { $eq: userId } } },
              { target_city: { documentId: { $eq: cityId } } },
              { target_type: { $eq: 'global' } }
            ]
          },
          fields: ['documentId'] // Нам нужны только ID для проверки
        }),
        find('notification-reads', {
          populate: ['notification'],
          filters: { users_permissions_user: { documentId: { $eq: userId } } }
        })
      ])

      // Собираем прочитанные
      const readIds = new Set(
        (readReceipts.data || []).map((r: any) => {
          const n = r.notification || r.NOTIFICATION
          return n?.documentId || n?.DOCUMENTID
        })
      )

      // Ищем хоть одно непрочитанное
      const unreadItems = (allNotifs.data || []).filter((n: any) => {
        const id = n.documentId || n.DOCUMENTID
        return !readIds.has(id)
      })

      hasUnread.value = unreadItems.length > 0

    } catch (e) {
      console.error("Ошибка проверки уведомлений:", e)
      hasUnread.value = false
    }
  }

  return { hasUnread, refresh }
}