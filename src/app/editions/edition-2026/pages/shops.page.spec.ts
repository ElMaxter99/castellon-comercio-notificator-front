import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { Commerce } from '../../../models/commerce.model';
import { commerceKey } from '../../../utils/commerce-utils';
import { Edition2026Store, SectorSummary } from '../edition-2026.store';
import { ShopsPageComponent } from './shops.page';

const shop = (name: string, sector: string, address = 'Calle Mayor'): Commerce => ({
  name,
  sector,
  phone: '',
  address,
  img: '',
  mapsUrl: ''
});

const COMMERCES = [
  shop('Zapatería Sol', 'Calzado'),
  shop('Moda Luna', 'Moda'),
  shop('Calzados Pepe', 'Calzado'),
  shop('Sin Clasificar', ''),
  shop('Bar Norte', 'Hostelería', 'Plaza Norte')
];

interface Harness {
  fixture: ComponentFixture<ShopsPageComponent>;
  navigate: jasmine.Spy;
  setParams: (params: Record<string, string>) => void;
  favorites: ReturnType<typeof signal<ReadonlySet<string>>>;
}

function setup(params: Record<string, string> = {}): Harness {
  const queryParamMap = new BehaviorSubject(convertToParamMap(params));
  const favorites = signal<ReadonlySet<string>>(new Set());
  const sectors: SectorSummary[] = [
    { name: 'Calzado', count: 2, color: '#111' },
    { name: 'Hostelería', count: 1, color: '#222' },
    { name: 'Moda', count: 1, color: '#333' }
  ];
  const store = {
    commerces: signal(COMMERCES),
    sectors: signal(sectors),
    loading: signal(false),
    error: signal(false),
    favorites,
    sectorColor: () => '#123456',
    isFavorite: () => false,
    toggleFavorite: () => undefined
  };
  const navigate = jasmine.createSpy('navigate').and.resolveTo(true);

  TestBed.configureTestingModule({
    imports: [ShopsPageComponent],
    providers: [
      provideTranslateService(),
      { provide: Edition2026Store, useValue: store },
      { provide: Router, useValue: { navigate } },
      { provide: ActivatedRoute, useValue: { queryParamMap, snapshot: { queryParamMap: queryParamMap.value } } }
    ]
  });
  const fixture = TestBed.createComponent(ShopsPageComponent);
  fixture.detectChanges();
  return {
    fixture,
    navigate,
    favorites,
    setParams: (next) => {
      queryParamMap.next(convertToParamMap(next));
      fixture.detectChanges();
    }
  };
}

const root = (h: Harness): HTMLElement => h.fixture.nativeElement as HTMLElement;
const groupNames = (h: Harness): string[] =>
  [...root(h).querySelectorAll('.group__name')].map((el) => (el.textContent ?? '').trim());
const shopNames = (h: Harness): string[] =>
  [...root(h).querySelectorAll('.shop__name')].map((el) => (el.textContent ?? '').trim());

describe('ShopsPageComponent', () => {
  it('agrupa por sector en orden alfabético y deja «sin sector» al final', () => {
    const h = setup();
    expect(groupNames(h)).toEqual(['Calzado', 'Hostelería', 'Moda', 'ed26.shops.noSector']);
  });

  it('sin filtros solo despliega el primer grupo', () => {
    const h = setup();
    expect(shopNames(h)).toEqual(['Calzados Pepe', 'Zapatería Sol']);
  });

  it('el chip de «Todos» muestra el total y hay un chip por sector con su recuento', () => {
    const h = setup();
    const chips = [...root(h).querySelectorAll('.chips-desktop .chip')].map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    );
    expect(chips.length).toBe(4);
    expect(chips[0]).toContain('5');
    expect(chips[1]).toContain('Calzado');
    expect(chips[1]).toContain('2');
  });

  it('filtra por texto sin distinguir acentos ni mayúsculas y abre todos los grupos', () => {
    const h = setup({ q: 'ZAPATERIA' });
    expect(shopNames(h)).toEqual(['Zapatería Sol']);
    expect(root(h).querySelector('.shops__counter-number')?.textContent).toContain('1');
  });

  it('filtra por sector exacto', () => {
    const h = setup({ sector: 'Moda' });
    expect(shopNames(h)).toEqual(['Moda Luna']);
  });

  it('también busca en la dirección', () => {
    const h = setup({ q: 'plaza norte' });
    expect(shopNames(h)).toEqual(['Bar Norte']);
  });

  it('el filtro de favoritos solo deja los guardados', () => {
    const h = setup({ fav: '1' });
    expect(shopNames(h)).toEqual([]);

    h.favorites.set(new Set([commerceKey(COMMERCES[1])]));
    h.setParams({ fav: '1' });
    expect(shopNames(h)).toEqual(['Moda Luna']);
  });

  it('muestra el estado vacío y permite quitar los filtros', () => {
    const h = setup({ q: 'nada que coincida' });
    expect(root(h).querySelector('.group')).toBeNull();
    (root(h).querySelector('.shops__empty-action button') as HTMLElement).click();
    expect(h.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { q: null, sector: null, fav: null } })
    );
  });

  it('pulsar un chip de sector navega con ese sector y «Todos» lo quita', () => {
    const h = setup();
    const chips = root(h).querySelectorAll<HTMLElement>('.chips-desktop .chip');
    chips[2].click();
    expect(h.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { sector: 'Hostelería' } }));

    chips[0].click();
    expect(h.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { sector: null } }));
  });

  it('el panel de filtros móvil se abre y cuenta los filtros activos', () => {
    const h = setup({ q: 'sol', sector: 'Calzado' });
    const toggle = root(h).querySelector<HTMLElement>('.shops__filters-toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(root(h).querySelector('.shops__filters-count')?.textContent).toContain('2');

    toggle.click();
    h.fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(root(h).querySelector('.shops__filters-body')?.classList).toContain('is-open');
  });

  it('«Ver en el mapa» navega a la vista de mapa con el comercio seleccionado', () => {
    const h = setup();
    const button = [...root(h).querySelectorAll<HTMLButtonElement>('.shop__pill')].find((b) =>
      (b.textContent ?? '').includes('ed26.shops.viewOnMap')
    );
    button?.click();
    expect(h.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { view: 'map', shop: 'Calzados Pepe|Calle Mayor' } })
    );
  });

  it('con un comercio seleccionado abre su grupo y resalta su tarjeta', () => {
    const h = setup({ shop: 'Moda Luna|Calle Mayor' });
    expect(shopNames(h)).toContain('Moda Luna');
    const selected = root(h).querySelectorAll('.shop.is-selected');
    expect(selected.length).toBe(1);
    expect(selected[0].getAttribute('data-shop-key')).toBe('Moda Luna|Calle Mayor');
  });
});
