import { safeColor } from './map-pin';

/** Colores de los sectores de un clúster, de más a menos frecuente, con su recuento. */
export function tallyColors(colors: readonly string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const color of colors) {
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const MAX_SEGMENTS = 5;
const OTHERS_COLOR = '#566A5A';

/**
 * `conic-gradient` con la composición por sectores. Se dibujan los 5 más frecuentes y el resto
 * se agrupa en gris. Los colores se validan (`safeColor`): van dentro de un atributo `style`.
 */
export function clusterGradient(tally: ReadonlyArray<readonly [string, number]>): string {
  const total = tally.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) {
    return `conic-gradient(${OTHERS_COLOR} 0 100%)`;
  }
  const shown = tally.slice(0, MAX_SEGMENTS).map(([color, count]) => [safeColor(color), count] as const);
  const restCount = tally.slice(MAX_SEGMENTS).reduce((sum, [, count]) => sum + count, 0);
  const parts = restCount > 0 ? [...shown, [OTHERS_COLOR, restCount] as const] : shown;

  let from = 0;
  const stops = parts.map(([color, count], index) => {
    const to = index === parts.length - 1 ? 100 : from + (count / total) * 100;
    const stop = `${color} ${from.toFixed(2)}% ${to.toFixed(2)}%`;
    from = to;
    return stop;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

/** Tres tallas según cuántos comercios agrupa el clúster (px). */
export function clusterSize(count: number): number {
  if (count < 10) {
    return 42;
  }
  return count < 30 ? 52 : 62;
}

/** HTML del icono del clúster: aro segmentado por sectores con el recuento en el centro. */
export function clusterHtml(colors: readonly string[]): { html: string; size: number } {
  const count = colors.length;
  const size = clusterSize(count);
  const gradient = clusterGradient(tallyColors(colors));
  return {
    size,
    html:
      `<span class="ed26-cluster__ring" style="--size:${size}px;background:${gradient}">` +
      `<span class="ed26-cluster__count">${Math.max(0, Math.trunc(count))}</span></span>`
  };
}
