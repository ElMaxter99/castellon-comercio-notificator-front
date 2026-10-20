import { resolveApiBaseUrl } from './api-url';

export const environment = {
  mode: 'development',
  apiBaseUrl: resolveApiBaseUrl('http://localhost:12001'),
  isLive: true, // isLive: false, // (MOCK)
};
