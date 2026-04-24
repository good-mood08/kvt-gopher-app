import { getData } from '~/composables/useLocalStore'

const PAGE_SIZE = 100

async function fetchAllReadRows(
  find: (c: string, o?: Record<string, unknown>) => Promise<{ data?: unknown[], meta?: { pagination?: { pageCount?: number } } }>,
  userId: string,
): Promise<Array<Record<string, unknown>>> {
  const rows: Array<Record<string, unknown>> = []
  let page = 1
  let pageCount = 1
  do {
    const res = await find('read-notigications', {
      filters: { users_permissions_user: { documentId: { $eq: userId } } },
      populate: {
        user_notigication: { fields: ['documentId'] },
        sity_notification: { fields: ['documentId'] },
      },
      pagination: { page, pageSize: PAGE_SIZE },
    })
    rows.push(...((res?.data ?? []) as Array<Record<string, unknown>>))
    pageCount = res?.meta?.pagination?.pageCount ?? 1
    page += 1
  } while (page <= pageCount)
  return rows
}

/**
 * Есть ли непрочитанные уведомления (user + city по выбранному городу), в логике как на /notification.
 */
export function useNotificationUnread() {
  const hasUnread = ref(false)

  async function refresh() {
    const { find } = useStrapi()
    const { fetchUser } = useStrapiAuth()
    hasUnread.value = false

    const user = await fetchUser()
    const userId = user.value?.documentId
    if (!userId) return

    const userNotiRes = await find('user-notigications', {
      filters: { users_permissions_user: { documentId: { $eq: userId } } },
      fields: ['documentId'],
      pagination: { pageSize: PAGE_SIZE },
    })
    const userItems = (userNotiRes?.data ?? []) as Array<Record<string, unknown>>

    const cityId = getData<string>('cityId')
    let cityItems: Array<Record<string, unknown>> = []
    if (cityId) {
      const cityNotiRes = await find('sity-notifications', {
        filters: { city: { documentId: { $eq: cityId } } },
        fields: ['documentId'],
        pagination: { pageSize: PAGE_SIZE },
      })
      cityItems = (cityNotiRes?.data ?? []) as Array<Record<string, unknown>>
    }

    const readRows = await fetchAllReadRows(find, userId)
    const readUser = new Set<string>()
    const readCity = new Set<string>()
    for (const r of readRows) {
      const u = r.user_notigication as { documentId?: string } | undefined
      const s = r.sity_notification as { documentId?: string } | undefined
      if (u?.documentId != null) readUser.add(String(u.documentId))
      if (s?.documentId != null) readCity.add(String(s.documentId))
    }

    for (const n of userItems) {
      const id = n.documentId
      if (id != null && !readUser.has(String(id))) {
        hasUnread.value = true
        return
      }
    }
    for (const n of cityItems) {
      const id = n.documentId
      if (id != null && !readCity.has(String(id))) {
        hasUnread.value = true
        return
      }
    }
  }

  return { hasUnread, refresh }
}
