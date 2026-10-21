import { Commerce } from '../../../models/commerce.model';
import { ShopPopupLabels, buildShopPopup } from './shop-popup';

const labels: ShopPopupLabels = {
  directions: 'Cómo llegar',
  call: 'Llamar',
  favoriteAdd: 'Guardar',
  favoriteRemove: 'Quitar',
  viewInList: 'Ver ficha'
};

const shop = (overrides: Partial<Commerce> = {}): Commerce => ({
  name: 'Panadería Sol',
  sector: 'Alimentación',
  phone: '+34 964 000 111',
  address: 'Calle Mayor, 1',
  img: '',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=39.98,-0.03',
  ...overrides
});

function build(commerce: Commerce, favorite = false, handlers: { fav?: () => void; list?: () => void } = {}): HTMLElement {
  return buildShopPopup({
    commerce,
    color: '#1E4D2B',
    favorite,
    labels,
    onToggleFavorite: handlers.fav ?? (() => undefined),
    onViewInList: handlers.list ?? (() => undefined)
  });
}

describe('buildShopPopup', () => {
  it('muestra nombre, sector y dirección', () => {
    const el = build(shop());
    expect(el.querySelector('.shop-popup__title')?.textContent).toBe('Panadería Sol');
    expect(el.querySelector('.shop-popup__sector')?.textContent).toBe('Alimentación');
    expect(el.querySelector('.shop-popup__address')?.textContent).toContain('Calle Mayor, 1');
  });

  it('no interpreta como HTML los datos del API', () => {
    const el = build(shop({ name: '<img src=x onerror=alert(1)>', address: '<b>x</b>' }));
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('b')).toBeNull();
    expect(el.querySelector('.shop-popup__title')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('llamar solo aparece con teléfono y deja solo dígitos y +', () => {
    const call = build(shop()).querySelector<HTMLAnchorElement>('a[href^="tel:"]');
    expect(call?.getAttribute('href')).toBe('tel:+34964000111');
    expect(build(shop({ phone: '' })).querySelector('a[href^="tel:"]')).toBeNull();
  });

  it('«Cómo llegar» solo admite http(s) y se abre en pestaña nueva sin referrer', () => {
    const go = build(shop()).querySelector<HTMLAnchorElement>('.shop-popup__btn--go');
    expect(go?.target).toBe('_blank');
    expect(go?.rel).toContain('noopener');
    expect(build(shop({ mapsUrl: 'javascript:alert(1)' })).querySelector('.shop-popup__btn--go')).toBeNull();
  });

  it('el botón de favorito refleja el estado y avisa al pulsarlo', () => {
    let toggled = 0;
    const off = build(shop(), false, { fav: () => toggled++ });
    const offButton = off.querySelector<HTMLButtonElement>('.shop-popup__btn--fav')!;
    expect(offButton.textContent).toContain('Guardar');
    expect(offButton.getAttribute('aria-pressed')).toBe('false');
    offButton.click();
    expect(toggled).toBe(1);

    const on = build(shop(), true).querySelector<HTMLButtonElement>('.shop-popup__btn--fav')!;
    expect(on.textContent).toContain('Quitar');
    expect(on.getAttribute('aria-pressed')).toBe('true');
  });

  it('«Ver ficha» avisa al pulsarlo', () => {
    let opened = 0;
    const el = build(shop(), false, { list: () => opened++ });
    const buttons = el.querySelectorAll<HTMLButtonElement>('button.shop-popup__btn');
    buttons[buttons.length - 1].click();
    expect(opened).toBe(1);
  });
});
