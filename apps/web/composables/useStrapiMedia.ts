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
