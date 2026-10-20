import { resolveApiBaseUrl } from './api-url';

export const environment = {
  mode: 'test-mock',
  apiBaseUrl: resolveApiBaseUrl('https://bcc-api.alvaromaxter.es'),
  isLive: false
};
