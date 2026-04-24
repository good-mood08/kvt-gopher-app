type UserNotificationType = 'warning' | 'error' | 'success' | 'info'
type UserNotificationPriority = 'low' | 'medium' | 'high' | 'critical'
type UserNotificationCategory = 'security' | 'profile' | 'system'

/**
 * Создаёт запись `user-notigications` для текущего пользователя (JWT).
 * Ошибки только в консоль — игровой флоу не ломаем.
 */
export function usePushUserNotification() {
  const { create } = useStrapi()
  const { fetchUser } = useStrapiAuth()

  async function pushUserNotification(options: {
    text: string
    type?: UserNotificationType
    priority?: UserNotificationPriority
    category?: UserNotificationCategory
  }) {
    try {
      const user = await fetchUser()
      const userId = user.value?.documentId
      if (!userId)
        return

      const res = await create('user-notigications', {
        text: options.text,
        type: options.type ?? 'success',
        priority: options.priority ?? 'low',
        category: options.category ?? 'system',
        users_permissions_user: userId,
        /** иначе запись остаётся черновиком и не попадёт в выдачу с `status=published` */
        publishedAt: new Date().toISOString(),
      }) as { data?: unknown, error?: { status?: number, message?: string, details?: unknown } }

      if (res?.error) {
        console.warn('[usePushUserNotification] ответ API с ошибкой', res.error)
      }
    }
    catch (err) {
      const e = err as { error?: unknown, message?: string }
      console.warn('[usePushUserNotification] не удалось создать уведомление', e?.error ?? e?.message ?? err)
    }
  }

  return { pushUserNotification }
}
