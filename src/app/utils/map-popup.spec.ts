import { Commerce } from '../models/commerce.model';
import { buildMapPopupHtml } from './map-popup';

const base: Commerce = {
  name: 'Panadería Sol',
  sector: 'Alimentación',
  phone: '964 000 000',
  address: 'Carrer Major, 1',
  img: '',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=39.98,-0.03'
};

describe('buildMapPopupHtml', () => {
  it('mantiene el marcado de siempre con datos normales', () => {
    const html = buildMapPopupHtml(base);
    expect(html).toContain('class="map-popup__title">Panadería Sol</h3>');
    expect(html).toContain('class="map-popup__sector">Alimentación</p>');
    expect(html).toContain('class="map-popup__address">Carrer Major, 1</p>');
    expect(html).toContain('<a class="map-popup__link" href="https://www.google.com/maps/');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('escapa HTML inyectado en nombre, sector y dirección', () => {
    const html = buildMapPopupHtml({
      ...base,
      name: '<img src=x onerror=alert(1)>',
      sector: '<script>alert(2)</script>',
      address: '"><b>x</b>'
    });
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('no genera enlace si la URL no es http(s)', () => {
    const html = buildMapPopupHtml({ ...base, mapsUrl: 'javascript:alert(1)' });
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('<div class="map-popup__link">');
  });

  it('una comilla en la URL no puede salirse del atributo href', () => {
    const html = buildMapPopupHtml({ ...base, mapsUrl: 'https://ejemplo.es/?q="onmouseover="alert(1)' });
    expect(html).not.toContain('onmouseover="alert');
  });
});
