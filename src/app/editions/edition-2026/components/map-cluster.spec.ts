import { clusterGradient, clusterHtml, clusterSize, tallyColors } from './map-cluster';

describe('map-cluster', () => {
  it('cuenta los colores de más a menos frecuente', () => {
    expect(tallyColors(['#111', '#222', '#111', '#333', '#111', '#222'])).toEqual([
      ['#111', 3],
      ['#222', 2],
      ['#333', 1]
    ]);
  });

  it('el degradado reparte el 100 % entre los sectores, de 0 a 100', () => {
    const gradient = clusterGradient([
      ['#111111', 2],
      ['#222222', 2]
    ]);
    expect(gradient).toBe('conic-gradient(#111111 0.00% 50.00%, #222222 50.00% 100.00%)');
  });

  it('agrupa en gris los sectores a partir del sexto', () => {
    const tally = ['#a00', '#b00', '#c00', '#d00', '#e00', '#f00', '#a10'].map((c) => [c, 1] as const);
    const gradient = clusterGradient(tally);
    expect(gradient).toContain('#566A5A');
    expect(gradient).not.toContain('#f00');
    expect(gradient.endsWith('100.00%)')).toBeTrue();
  });

  it('valida los colores: no deja pasar texto que no sea hexadecimal', () => {
    const gradient = clusterGradient([['red; background:url(x)', 1]]);
    expect(gradient).not.toContain('url');
    expect(gradient).toContain('#566A5A');
  });

  it('sin comercios devuelve un degradado neutro', () => {
    expect(clusterGradient([])).toBe('conic-gradient(#566A5A 0 100%)');
  });

  it('la talla crece con el recuento', () => {
    expect(clusterSize(2)).toBeLessThan(clusterSize(15));
    expect(clusterSize(15)).toBeLessThan(clusterSize(80));
  });

  it('el HTML del clúster lleva solo el número de comercios y el degradado', () => {
    const { html, size } = clusterHtml(['#111111', '#111111', '#222222']);
    expect(size).toBe(42);
    expect(html).toContain('>3</span>');
    expect(html).toContain('conic-gradient');
    expect(html).not.toContain('<script');
  });
});
