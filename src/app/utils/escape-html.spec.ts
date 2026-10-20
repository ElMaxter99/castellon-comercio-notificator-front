import { escapeHtml, safeHttpUrl } from './escape-html';

describe('escapeHtml', () => {
  it('escapa los caracteres con significado en HTML', () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;'
    );
  });

  it('trata null y undefined como cadena vacía', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('safeHttpUrl', () => {
  it('admite http y https', () => {
    expect(safeHttpUrl('https://www.google.com/maps/search/?api=1&query=39.9,-0.03')).toContain('google.com');
    expect(safeHttpUrl('http://ejemplo.es/')).toBe('http://ejemplo.es/');
  });

  it('descarta esquemas peligrosos y valores inválidos', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBe('');
    expect(safeHttpUrl('data:text/html,<script>1</script>')).toBe('');
    expect(safeHttpUrl('no es una url')).toBe('');
    expect(safeHttpUrl(undefined)).toBe('');
  });
});
