/** Datos de un pin del mapa. Solo valores controlados: nunca texto del API. */
export interface PinOptions {
  /** Color del sector (hex de la paleta). */
  color: string;
  /** Icono del sector (emoji de `sectorIcon`). */
  icon: string;
  favorite?: boolean;
  selected?: boolean;
}

/** Tamaño del icono de Leaflet (px): caja táctil de 40×48 con la punta abajo en el centro. */
export const PIN_SIZE: [number, number] = [40, 48];
export const PIN_ANCHOR: [number, number] = [20, 46];

const SAFE_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const FALLBACK_COLOR = '#566A5A';

/** Solo se admiten colores hexadecimales: se interpolan en un atributo `style`. */
export function safeColor(color: string): string {
  return SAFE_COLOR.test(color) ? color : FALLBACK_COLOR;
}

/** Escapa el icono por si algún día llega algo distinto de un emoji. */
export function safeIcon(icon: string): string {
  return icon.replace(/[&<>"']/g, '');
}

/** HTML del pin (gota con el icono del sector, estrella si es favorito, aro si está seleccionado). */
export function pinHtml({ color, icon, favorite = false, selected = false }: PinOptions): string {
  const state = selected ? ' is-selected' : '';
  const star = favorite ? '<span class="ed26-pin__fav" aria-hidden="true">★</span>' : '';
  return (
    `<span class="ed26-pin${state}" style="--c:${safeColor(color)}">` +
    `<span class="ed26-pin__body"><span class="ed26-pin__icon" aria-hidden="true">${safeIcon(icon)}</span></span>` +
    `${star}</span>`
  );
}
