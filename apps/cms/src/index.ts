import type { Core } from '@strapi/strapi'
import { ensureDataUserPermissionsForAuthenticated } from './bootstrap/ensure-data-user-permissions'

interface YandexProfile {
  login?: string;
  real_name?: string;
  display_name?: string;
  default_email?: string;
  emails?: string[];
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // Регистрируем кастомного провайдера Yandex
    strapi
      .plugin('users-permissions')
      .service('providers-registry')
      .add('yandex', {
        icon: 'yandex',
        enabled: true,
        grantConfig: {
          key: '',
          secret: '',
          callback: `${strapi.config.server.url}/api/connect/yandex/callback`,
          scope: ['login:email', 'login:info'],
          scope_delimiter: ' ',
          authorize_url: 'https://oauth.yandex.ru/authorize',
          access_url: 'https://oauth.yandex.ru/token',
          oauth: 2
        },
        // Добавляем типизацию для токена
        async authCallback({ accessToken }: { accessToken: string }) {
          try {
            const response = await fetch('https://login.yandex.ru/info?format=json', {
              headers: { Authorization: `OAuth ${accessToken}` },
            });
            const data = await response.json() as YandexProfile;

            return {
              username: data.login || data.real_name,
              email: data.default_email || data.emails?.[0],
            };
          } catch (err) {
            throw new Error('Ошибка при получении данных из Яндекс ID');
          }
        },
      });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Твоя существующая логика остается без изменений
    await ensureDataUserPermissionsForAuthenticated(strapi)
  },
}