import { Commerce } from '../models/commerce.model';
import { commerceKey, coordsFromMapsUrl, normalizeText } from './commerce-utils';

describe('normalizeText', () => {
  it('ignora mayúsculas y acentos', () => {
    expect(normalizeText('  Cafetería ÓPTICA ')).toBe('cafeteria optica');
  });

  it('tolera null y undefined', () => {
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });

  it('permite buscar sin acentos', () => {
    expect(normalizeText('Librería La Plaça').includes(normalizeText('libreria'))).toBeTrue();
  });
});

describe('coordsFromMapsUrl', () => {
  it('extrae lat y lng de query=lat,lng', () => {
    expect(coordsFromMapsUrl('https://www.google.com/maps/search/?api=1&query=39.986,-0.0376')).toEqual([39.986, -0.0376]);
  });

  it('devuelve null si no hay coordenadas válidas', () => {
    expect(coordsFromMapsUrl('https://www.google.com/maps/search/?api=1&query=Carrer%20Major,%20Castell%C3%B3')).toBeNull();
    expect(coordsFromMapsUrl('https://www.google.com/maps')).toBeNull();
    expect(coordsFromMapsUrl('')).toBeNull();
    expect(coordsFromMapsUrl(undefined)).toBeNull();
  });
});

describe('commerceKey', () => {
  it('combina nombre y dirección', () => {
    const commerce = { name: 'A', address: 'B' } as Commerce;
    expect(commerceKey(commerce)).toBe('A|B');
  });
});
