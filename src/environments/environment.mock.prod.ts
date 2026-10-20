import { resolveApiBaseUrl } from './api-url';

export const environment = {
  mode: 'production-mock',
  apiBaseUrl: resolveApiBaseUrl('https://bcc-api.alvaromaxter.es'),
  isLive: false
};
