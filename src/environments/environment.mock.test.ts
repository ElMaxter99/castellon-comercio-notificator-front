import { resolveApiBaseUrl } from './api-url';

export const environment = {
  mode: 'test-mock',
  apiBaseUrl: resolveApiBaseUrl('https://castellon-comercio-notificator-api.onrender.com'),
  isLive: false
};
