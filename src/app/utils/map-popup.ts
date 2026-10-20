import { Commerce } from '../models/commerce.model';
import { escapeHtml, safeHttpUrl } from './escape-html';

/**
 * HTML del popup del mapa de la edición 2025. Los datos vienen de una web externa,
 * así que todo se escapa y el enlace solo se admite si es http(s). El marcado y las
 * clases (`map-popup__*`) son los de siempre: el aspecto no cambia.
 */
export function buildMapPopupHtml(commerce: Commerce): string {
  const address = commerce.address ? `<p class="map-popup__address">${escapeHtml(commerce.address)}</p>` : '';
  const sector = commerce.sector ? `<p class="map-popup__sector">${escapeHtml(commerce.sector)}</p>` : '';
  const body = `
          <h3 class="map-popup__title">${escapeHtml(commerce.name)}</h3>
          ${sector}
          ${address}`;

  const href = safeHttpUrl(commerce.mapsUrl);
  const content = href
    ? `<a class="map-popup__link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${body}
        </a>`
    : `<div class="map-popup__link">${body}
        </div>`;

  return `
      <article class="map-popup">
        ${content}
      </article>
    `;
}
