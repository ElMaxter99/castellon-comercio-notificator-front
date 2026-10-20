import { resolveApiBaseUrl } from './api-url';

export const environment = {
  mode: 'production',
  apiBaseUrl: resolveApiBaseUrl('https://castellon-comercio-notificator-api.onrender.com'),
  isLive: true
};
