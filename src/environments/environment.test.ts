import { resolveApiBaseUrl } from './api-url';

export const environment = {
  mode: 'test',
  apiBaseUrl: resolveApiBaseUrl('https://bcc-api.alvaromaxter.es'),
  isLive: true
};
