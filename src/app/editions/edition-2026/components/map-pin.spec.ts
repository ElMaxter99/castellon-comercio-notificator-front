import { PIN_ANCHOR, PIN_SIZE, pinHtml, safeColor, safeIcon } from './map-pin';

describe('map-pin', () => {
  it('dibuja el pin con el color y el icono del sector', () => {
    const html = pinHtml({ color: '#1E4D2B', icon: '🍎' });
    expect(html).toContain('--c:#1E4D2B');
    expect(html).toContain('🍎');
    expect(html).not.toContain('ed26-pin__fav');
    expect(html).not.toContain('is-selected');
  });

  it('añade la estrella a los favoritos y el aro a los seleccionados', () => {
    const html = pinHtml({ color: '#F77F00', icon: '👟', favorite: true, selected: true });
    expect(html).toContain('ed26-pin__fav');
    expect(html).toContain('is-selected');
  });

  it('solo admite colores hexadecimales: cualquier otra cosa cae al neutro', () => {
    expect(safeColor('#abc')).toBe('#abc');
    expect(safeColor('red; background:url(x)')).toBe('#566A5A');
    expect(safeColor('"><script>')).toBe('#566A5A');
    expect(pinHtml({ color: 'x" onmouseover="alert(1)', icon: '🏪' })).not.toContain('onmouseover');
  });

  it('elimina de un icono los caracteres que podrían abrir HTML', () => {
    expect(safeIcon('<img src=x onerror=1>')).not.toContain('<');
    expect(safeIcon('🏪')).toBe('🏪');
  });

  it('la punta del pin queda abajo en el centro de una caja táctil de al menos 40 px', () => {
    expect(PIN_SIZE[0]).toBeGreaterThanOrEqual(40);
    expect(PIN_ANCHOR[0]).toBe(PIN_SIZE[0] / 2);
    expect(PIN_ANCHOR[1]).toBeLessThanOrEqual(PIN_SIZE[1]);
  });
});
