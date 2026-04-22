type StoreUnit = 's' | 'm' | 'h' | 'd'

type StoredValue<T = unknown> = {
  created: number
  value: T
  expiry: number
  unit: StoreUnit
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage ?? null
}

function unitToMs(unit: StoreUnit): number {
  if (unit === 's') return 1000
  if (unit === 'h') return 60 * 60 * 1000
  if (unit === 'd') return 24 * 60 * 60 * 1000
  return 60 * 1000
}

export function getData<T = unknown>(key: string): T | null {
  try {
    const storage = getStorage()
    if (!storage) return null

    const raw = storage.getItem(key)
    if (!raw) return null

    const payload = JSON.parse(raw) as StoredValue<T>
    const now = Date.now()
    const isValid = payload.created + payload.expiry * unitToMs(payload.unit) > now
    if (!isValid) {
      storage.removeItem(key)
      return null
    }

    return payload.value
  } catch {
    return null
  }
}

export function setData<T = unknown>(
  key: string,
  value: T,
  expiry = 5,
  unit: StoreUnit = 'm',
): StoredValue<T> | null {
  try {
    const storage = getStorage()
    if (!storage) return null

    const payload: StoredValue<T> = {
      created: Date.now(),
      value,
      expiry,
      unit,
    }
    storage.setItem(key, JSON.stringify(payload))
    return payload
  } catch {
    return null
  }
}

