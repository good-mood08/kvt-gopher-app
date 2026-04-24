import { getRequestHeader } from 'h3'

function applyInferredStrapiUrl(url: string) {
  const cfg = useRuntimeConfig() as Record<string, any>
  if (!cfg.public)
    cfg.public = {}
  if (!cfg.public.strapi)
    cfg.public.strapi = {}

  if (!cfg.public.strapi.url)
    cfg.public.strapi.url = url
  if (!cfg.public.strapiUrl)
    cfg.public.strapiUrl = url
}

export default defineNuxtPlugin((nuxtApp) => {
  const cfg = useRuntimeConfig() as Record<string, any>
  const hasExplicitUrl = Boolean(cfg.public?.strapi?.url || cfg.public?.strapiUrl)
  if (hasExplicitUrl)
    return

  if (import.meta.server) {
    const event = nuxtApp.ssrContext?.event
    if (!event)
      return
    const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host')
    if (!host)
      return
    const proto = getRequestHeader(event, 'x-forwarded-proto') || 'http'
    const hostname = host.split(':')[0]
    applyInferredStrapiUrl(`${proto}://${hostname}:1337`)
    return
  }

  if (import.meta.client) {
    const { protocol, hostname } = window.location
    applyInferredStrapiUrl(`${protocol}//${hostname}:1337`)
  }
})

