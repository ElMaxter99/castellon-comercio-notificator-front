import { resolveApiBaseUrl } from './api-url';

describe('resolveApiBaseUrl', () => {
  it('usa el valor por defecto cuando no hay API_BASE_URL', () => {
    expect(resolveApiBaseUrl('http://localhost:12001')).toBe('http://localhost:12001');
  });

  it('elimina las barras finales', () => {
    expect(resolveApiBaseUrl('https://mi-api.onrender.com///')).toBe('https://mi-api.onrender.com');
  });
});
