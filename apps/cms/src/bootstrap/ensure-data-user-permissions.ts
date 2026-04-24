import type { Core } from '@strapi/strapi'

const DATA_USER_ACTIONS = [
  'api::data-user.data-user.find',
  'api::data-user.data-user.findOne',
  'api::data-user.data-user.create',
  'api::data-user.data-user.update',
] as const

/** Смена костюма: `update` на `cloth-user`; `findOne` — на случай прямых GET по id (не обязателен после правки фронта). */
const CLOTH_USER_EXTRA_ACTIONS = [
  'api::cloth-user.cloth-user.update',
  'api::cloth-user.cloth-user.findOne',
] as const

/** Пуш уведомлений с клиента после прохождения локации / записи на мероприятие. */
const USER_NOTIFICATION_CREATE = [
  'api::user-notigication.user-notigication.create',
] as const

/**
 * Для фронта с JWT: создаёт записи `up_permissions`, если их ещё нет для роли authenticated.
 * (В стиле seed: одна строка permission = action + role.)
 */
export async function ensureDataUserPermissionsForAuthenticated(strapi: Core.Strapi) {
  try {
    const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    })
    if (!authRole?.id) {
      strapi.log.warn('[kvt] bootstrap: роль authenticated не найдена')
      return
    }

    const roleId = authRole.id

    for (const action of [
      ...DATA_USER_ACTIONS,
      ...CLOTH_USER_EXTRA_ACTIONS,
      ...USER_NOTIFICATION_CREATE,
    ]) {
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action, role: roleId },
      })
      if (existing) continue

      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action,
          role: roleId,
        },
      })
      strapi.log.info(`[kvt] bootstrap: permission → authenticated: ${action}`)
    }
  }
  catch (err) {
    strapi.log.error('[kvt] bootstrap: ensureDataUserPermissionsForAuthenticated', err)
  }
}
