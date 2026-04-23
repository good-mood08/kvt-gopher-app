/**
 * Полный URL файла из Strapi Upload (поле `url` в ответе API).
 * База берётся из `NUXT_PUBLIC_STRAPI_URL` / `runtimeConfig.public.strapiUrl`.
 */
export function useCmsMedia(relativePath: string | undefined | null): string {
  if (relativePath == null || relativePath === '') return ''
  const trimmed = String(relativePath).trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const config = useRuntimeConfig()
  const base = String(config.public.strapiUrl || '').replace(/\/$/, '')
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${base}${path}`
}

function pickStrapiUploadUrl(entry: unknown): string {
  if (entry == null || entry === '') return ''
  if (typeof entry === 'string') return entry
  const o = entry as Record<string, unknown>
  if (typeof o.url === 'string') return o.url
  const d = o.data
  if (d && typeof d === 'object') {
    const dd = d as Record<string, unknown>
    if (typeof dd.url === 'string') return dd.url
    const attrs = dd.attributes as Record<string, unknown> | undefined
    if (attrs && typeof attrs.url === 'string') return attrs.url as string
  }
  return ''
}

/** Один файл из поля типа Media (Strapi v4/v5, плоский или вложенный ответ). */
export function useStrapiMediaUrl(field: unknown): string {
  return useCmsMedia(pickStrapiUploadUrl(field))
}

/** Первый непустой URL из media multiple или одиночного поля. */
export function useStrapiMediaUrlFirst(field: unknown): string {
  if (Array.isArray(field)) {
    for (const item of field) {
      const u = pickStrapiUploadUrl(item)
      if (u) return useCmsMedia(u)
    }
    return ''
  }
  return useStrapiMediaUrl(field)
}
