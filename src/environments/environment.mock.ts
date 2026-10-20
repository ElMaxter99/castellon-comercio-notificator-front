import { resolveApiBaseUrl } from './api-url';

export const environment = {
  mode: 'development-mock',
  apiBaseUrl: resolveApiBaseUrl('http://localhost:12001'),
  isLive: false
};
