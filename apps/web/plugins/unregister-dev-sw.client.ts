export default defineNuxtPlugin(() => {
  if (!import.meta.dev)
    return

  if (import.meta.env.NUXT_PWA_DEV === 'true')
    return

  if (!('serviceWorker' in navigator))
    return

  window.addEventListener('load', () => {
    void navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        const currentOrigin = window.location.origin

        return Promise.all(
          registrations
            .filter(registration => registration.scope.startsWith(currentOrigin))
            .map(registration => registration.unregister()),
        )
      })
      .catch(() => {})
  })
})
