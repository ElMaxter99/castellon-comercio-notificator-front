import { Commerce } from '../../../models/commerce.model';
import { safeHttpUrl } from '../../../utils/escape-html';

/** Textos ya traducidos del popup. */
export interface ShopPopupLabels {
  directions: string;
  call: string;
  favoriteAdd: string;
  favoriteRemove: string;
  viewInList: string;
}

export interface ShopPopupOptions {
  commerce: Commerce;
  /** Color del sector (hex ya validado por quien llama). */
  color: string;
  favorite: boolean;
  labels: ShopPopupLabels;
  onToggleFavorite: () => void;
  onViewInList: () => void;
}

/**
 * Tarjeta del popup del mapa 2026: nombre, sector, dirección y acciones (llamar, cómo llegar,
 * favorito y ver ficha). Se construye con nodos DOM y `textContent`: los datos del API nunca se
 * interpolan como HTML.
 */
export function buildShopPopup({ commerce, color, favorite, labels, onToggleFavorite, onViewInList }: ShopPopupOptions): HTMLElement {
  const root = el('div', 'shop-popup');
  root.style.setProperty('--c', /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#566A5A');

  const title = el('strong', 'shop-popup__title', commerce.name);
  root.append(title);

  if (commerce.sector) {
    root.append(el('span', 'shop-popup__sector', commerce.sector));
  }
  if (commerce.address) {
    root.append(el('div', 'shop-popup__address', `📍 ${commerce.address}`));
  }

  const actions = el('div', 'shop-popup__actions');

  const phone = (commerce.phone ?? '').replace(/[^\d+]/g, '');
  if (phone) {
    const call = el('a', 'shop-popup__btn', `📞 ${labels.call}`) as HTMLAnchorElement;
    call.href = `tel:${phone}`;
    actions.append(call);
  }

  const maps = safeHttpUrl(commerce.mapsUrl);
  if (maps) {
    const go = el('a', 'shop-popup__btn shop-popup__btn--go', `${labels.directions} →`) as HTMLAnchorElement;
    go.href = maps;
    go.target = '_blank';
    go.rel = 'noopener noreferrer';
    actions.append(go);
  }

  const fav = el('button', 'shop-popup__btn shop-popup__btn--fav', favorite ? `★ ${labels.favoriteRemove}` : `☆ ${labels.favoriteAdd}`) as HTMLButtonElement;
  fav.type = 'button';
  fav.setAttribute('aria-pressed', String(favorite));
  fav.addEventListener('click', onToggleFavorite);
  actions.append(fav);

  const list = el('button', 'shop-popup__btn', `📋 ${labels.viewInList}`) as HTMLButtonElement;
  list.type = 'button';
  list.addEventListener('click', onViewInList);
  actions.append(list);

  root.append(actions);
  return root;
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}
