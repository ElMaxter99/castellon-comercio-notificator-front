import { resolveApiBaseUrl } from './api-url';

export const environment = {
  mode: 'production-mock',
  apiBaseUrl: resolveApiBaseUrl('https://castellon-comercio-notificator-api.onrender.com'),
  isLive: false
};
