import { resolveApiBaseUrl } from './api-url';

export const environment = {
  mode: 'production',
  apiBaseUrl: resolveApiBaseUrl('https://bcc-api.alvaromaxter.es'),
  isLive: true
};
