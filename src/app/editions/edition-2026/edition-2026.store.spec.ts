import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Commerce } from '../../models/commerce.model';
import { CommerceService } from '../../services/commerce.service';
import { Edition2026Store, SECTOR_COLORS } from './edition-2026.store';

const FAVORITES_KEY = 'castellon-comercio-favorites-2026';

const commerce = (name: string, sector: string): Commerce => ({
  name,
  sector,
  phone: '1',
  address: `Calle ${name}`,
  img: '',
  mapsUrl: ''
});

function setup(options: { commerces?: Commerce[]; fail?: boolean; history?: unknown[] } = {}): Edition2026Store {
  const service = {
    getCommerces: () => (options.fail ? throwError(() => new Error('boom')) : of(options.commerces ?? [])),
    getStatus: () => of(null),
    getHistory: () => of(options.history ?? [])
  };
  TestBed.configureTestingModule({
    providers: [Edition2026Store, { provide: CommerceService, useValue: service }]
  });
  return TestBed.inject(Edition2026Store);
}

describe('Edition2026Store', () => {
  beforeEach(() => localStorage.removeItem(FAVORITES_KEY));
  afterEach(() => localStorage.removeItem(FAVORITES_KEY));

  it('carga los comercios y deja de estar cargando', () => {
    const store = setup({ commerces: [commerce('A', 'Moda')] });
    expect(store.commerces().length).toBe(1);
    expect(store.loading()).toBeFalse();
    expect(store.error()).toBeFalse();
  });

  it('marca error si el API falla', () => {
    const store = setup({ fail: true });
    expect(store.error()).toBeTrue();
    expect(store.loading()).toBeFalse();
  });

  it('agrupa los sectores con su recuento, más numerosos primero y a igualdad por nombre', () => {
    const store = setup({
      commerces: [
        commerce('1', 'Moda'),
        commerce('2', 'Hostelería'),
        commerce('3', 'Moda'),
        commerce('4', 'Calzado'),
        commerce('5', '  '),
        commerce('6', '')
      ]
    });
    expect(store.sectors().map((s) => [s.name, s.count])).toEqual([
      ['Moda', 2],
      ['Calzado', 1],
      ['Hostelería', 1]
    ]);
  });

  it('asigna un color estable de la paleta a cada sector, sin distinguir mayúsculas', () => {
    const store = setup();
    const color = store.sectorColor('Moda');
    expect(SECTOR_COLORS).toContain(color);
    expect(store.sectorColor(' moda ')).toBe(color);
  });

  it('alterna favoritos y los persiste en localStorage', () => {
    const store = setup();
    const shop = commerce('Tienda', 'Moda');
    expect(store.isFavorite(shop)).toBeFalse();

    store.toggleFavorite(shop);
    expect(store.isFavorite(shop)).toBeTrue();
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]').length).toBe(1);

    store.toggleFavorite(shop);
    expect(store.isFavorite(shop)).toBeFalse();
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]').length).toBe(0);
  });

  it('restaura los favoritos guardados e ignora datos corruptos', () => {
    localStorage.setItem(FAVORITES_KEY, '{no es json');
    expect(setup().favorites().size).toBe(0);

    TestBed.resetTestingModule();
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(['a', 3, 'b']));
    expect([...setup().favorites()]).toEqual(['a', 'b']);
  });

  it('cuenta las altas de los últimos 30 días', () => {
    const day = 24 * 60 * 60 * 1000;
    const entry = (ago: number, added: number) => ({
      timestamp: new Date(Date.now() - ago * day).toISOString(),
      countAfter: 0,
      added: Array.from({ length: added }, (_, i) => `n${i}`),
      removed: []
    });
    const store = setup({ history: [entry(2, 5), entry(29, 3), entry(45, 100)] });
    expect(store.recentAdded()).toBe(8);
  });
});
