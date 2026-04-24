/**
 * data-user controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::data-user.data-user', ({ strapi }) => ({
  async update(ctx) {
    const response = await super.update(ctx)

    try {
      const raw = ctx.request.body as { data?: { cloth_user?: unknown }, cloth_user?: unknown } | undefined
      const clothUser = raw?.data?.cloth_user ?? raw?.cloth_user
      const resData = (response as { data?: { documentId?: string } })?.data
      const state = ctx.state as {
        user?: { documentId?: string, username?: string, id?: number }
      }
      const u = state.user
      strapi.log.info(
        `[kvt] data-user: смена образа сохранена documentId=${resData?.documentId ?? '?'} cloth_user=${JSON.stringify(clothUser)} user=${u?.username ?? u?.documentId ?? u?.id ?? '?'}`,
      )
    }
    catch (e) {
      strapi.log.warn('[kvt] data-user: лог после update не записан', e)
    }

    return response
  },
}))
