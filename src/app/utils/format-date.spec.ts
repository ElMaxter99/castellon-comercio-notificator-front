import { formatDate } from './format-date';

describe('formatDate', () => {
  it('formatea con el locale indicado', () => {
    const text = formatDate('2026-10-20T12:00:00Z', 'es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    expect(text).toContain('2026');
    expect(text.toLowerCase()).toContain('octubre');
  });

  it('devuelve cadena vacía con una fecha inválida', () => {
    expect(formatDate('no es una fecha', 'es-ES', {})).toBe('');
  });
});
