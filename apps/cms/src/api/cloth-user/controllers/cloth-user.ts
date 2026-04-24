/**
 * cloth-user controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::cloth-user.cloth-user', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx)

    try {
      const raw = ctx.request.body as {
        data?: { cloth?: unknown, users_permissions_user?: unknown }
        cloth?: unknown
        users_permissions_user?: unknown
      } | undefined
      const d = raw?.data ?? {
        cloth: raw?.cloth,
        users_permissions_user: raw?.users_permissions_user,
      }
      const resData = (response as { data?: { documentId?: string } })?.data
      const state = ctx.state as {
        user?: { documentId?: string, username?: string, id?: number }
      }
      const u = state.user
      strapi.log.info(
        `[kvt] cloth-user: костюм добавлен в коллекцию documentId=${resData?.documentId ?? '?'} cloth=${JSON.stringify(d?.cloth)} users_permissions_user=${JSON.stringify(d?.users_permissions_user)} caller=${u?.username ?? u?.documentId ?? u?.id ?? '?'}`,
      )
    }
    catch (e) {
      strapi.log.warn('[kvt] cloth-user: лог после create не записан', e)
    }

    return response
  },

  async update(ctx) {
    const response = await super.update(ctx)

    try {
      const raw = ctx.request.body as {
        data?: { data_user?: unknown }
        data_user?: unknown
      } | undefined
      const dataUser = raw?.data?.data_user ?? raw?.data_user
      if (dataUser !== undefined) {
        const resData = (response as { data?: { documentId?: string } })?.data
        const state = ctx.state as {
          user?: { documentId?: string, username?: string, id?: number }
        }
        const u = state.user
        strapi.log.info(
          `[kvt] cloth-user: связь data_user обновлена clothUser=${resData?.documentId ?? ctx.params?.id ?? '?'} data_user=${JSON.stringify(dataUser)} caller=${u?.username ?? u?.documentId ?? u?.id ?? '?'}`,
        )
      }
    }
    catch (e) {
      strapi.log.warn('[kvt] cloth-user: лог после update не записан', e)
    }

    return response
  },
}))
