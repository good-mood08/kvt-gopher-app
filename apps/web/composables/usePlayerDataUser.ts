const DATA_USER_POPULATE = {
  cloth_user: {
    populate: {
      cloth: { populate: { data: true, sislik: true } },
    },
  },
} as const

function unwrapStrapiEntry(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const d = p.data
  if (d && typeof d === 'object' && !Array.isArray(d)) return d as Record<string, unknown>
  return p
}

/** Связь в ответе API может быть `{ documentId }` или `{ data: { documentId } }`. */
function relationDocumentId(entry: unknown): string {
  if (entry == null) return ''
  let cur: unknown = entry
  if (typeof cur === 'object' && cur !== null && 'data' in cur) {
    const inner = (cur as { data: unknown }).data
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) cur = inner
  }
  if (typeof cur === 'object' && cur !== null && 'documentId' in cur) {
    const v = (cur as { documentId?: unknown }).documentId
    return v != null ? String(v) : ''
  }
  return ''
}

export function usePlayerDataUser() {
  const { find, create, update } = useStrapi()
  const { fetchUser } = useStrapiAuth()
  /** Общий EXP для хедера, профиля, города и т.д. */
  const exp = useState<number>('kvt-data-user-exp', () => 0)

  function syncExpFromRow(row: Record<string, unknown> | null) {
    exp.value = row ? Number(row.exp ?? 0) : 0
  }

  async function loadOrCreateDataUser(): Promise<Record<string, unknown> | null> {
    const user = await fetchUser()
    const userId = user.value?.documentId
    if (!userId) {
      syncExpFromRow(null)
      return null
    }

    const res = await find('data-users', {
      filters: { users_permissions_user: { documentId: { $eq: userId } } },
      populate: DATA_USER_POPULATE,
      pagination: { pageSize: 1 },
    })
    const existing = (res?.data?.[0] ?? null) as Record<string, unknown> | null
    if (existing?.documentId) {
      syncExpFromRow(existing)
      return existing
    }

    const created = await create('data-users', {
      users_permissions_user: userId,
      exp: 0,
    })
    const doc = unwrapStrapiEntry(created)
    if (!doc?.documentId) {
      syncExpFromRow(null)
      return null
    }

    const again = await find('data-users', {
      filters: { documentId: { $eq: String(doc.documentId) } },
      populate: DATA_USER_POPULATE,
      pagination: { pageSize: 1 },
    })
    const finalRow = (again?.data?.[0] ?? doc) as Record<string, unknown>
    syncExpFromRow(finalRow)
    return finalRow
  }

  async function addExp(amount: number): Promise<void> {
    if (!amount) return
    const row = await loadOrCreateDataUser()
    if (!row?.documentId) return
    const current = Number(row.exp ?? 0)
    const next = current + amount
    await update('data-users', String(row.documentId), { exp: next })
    exp.value = Math.max(0, next)
  }

  /**
   * «Надетый» костюм — связь oneToOne на **владеющей** стороне `cloth-user.data_user`
   * (`data-user.cloth_user` только mappedBy, через REST на data-user её не записать).
   */
  async function setEquippedClothUser(clothUserDocumentId: string | null): Promise<void> {
    const user = await fetchUser()
    const userId = user.value?.documentId
    if (!userId) throw new Error('NO_USER')

    const row = await loadOrCreateDataUser()
    if (!row?.documentId) throw new Error('NO_DATA_USER')

    const dataUserDocId = String(row.documentId)

    const linkedRes = await find('cloth-users', {
      filters: { data_user: { documentId: { $eq: dataUserDocId } } },
      fields: ['documentId'],
      pagination: { pageSize: 25 },
    })
    const linkedIds = ((linkedRes?.data ?? []) as Array<Record<string, unknown>>)
      .map(r => (r.documentId != null ? String(r.documentId) : ''))
      .filter(Boolean)

    if (clothUserDocumentId != null) {
      const id = clothUserDocumentId.trim()
      if (!id) throw new Error('INVALID_CLOTH_USER')

      const owned = await find('cloth-users', {
        filters: {
          documentId: { $eq: id },
          users_permissions_user: { documentId: { $eq: userId } },
        },
        fields: ['documentId'],
        pagination: { pageSize: 1 },
      })
      if (!(owned?.data?.length)) throw new Error('CLOTH_USER_NOT_OWNED')

      for (const cuId of linkedIds) {
        if (cuId === id) continue
        await update('cloth-users', cuId, { data_user: null })
      }

      await update('cloth-users', id, { data_user: dataUserDocId })

      // Не используем findOne: у authenticated часто нет `cloth-user.findOne` → 403.
      const verify = await find('cloth-users', {
        filters: {
          documentId: { $eq: id },
          users_permissions_user: { documentId: { $eq: userId } },
        },
        populate: { data_user: { fields: ['documentId'] } },
        pagination: { pageSize: 1 },
      })
      const cu = (verify?.data?.[0] ?? null) as Record<string, unknown> | null
      if (relationDocumentId(cu?.data_user) !== dataUserDocId) {
        throw new Error('RELATION_NOT_PERSISTED')
      }
      return
    }

    for (const cuId of linkedIds) {
      await update('cloth-users', cuId, { data_user: null })
    }

    const still = await find('cloth-users', {
      filters: { data_user: { documentId: { $eq: dataUserDocId } } },
      fields: ['documentId'],
      pagination: { pageSize: 1 },
    })
    if ((still?.data?.length ?? 0) > 0) {
      throw new Error('RELATION_CLEAR_FAILED')
    }
  }

  return { exp, loadOrCreateDataUser, addExp, setEquippedClothUser }
}
