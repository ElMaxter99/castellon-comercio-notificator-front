import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { defer, of, throwError } from 'rxjs';
import { Commerce } from '../../models/commerce.model';
import { CommerceService } from '../../services/commerce.service';
import { COLD_START_CONFIG, Edition2026Store, NO_SECTOR_COLOR, SECTOR_COLORS } from './edition-2026.store';

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
    providers: [
      Edition2026Store,
      { provide: CommerceService, useValue: service },
      // Sin esperas ni avisos por defecto: los tests de arranque en frío los definen aparte
      { provide: COLD_START_CONFIG, useValue: { retryDelaysMs: [], hintAfterMs: 60000 } }
    ]
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

  it('da un color distinto a cada sector mientras haya colores libres, por orden alfabético', () => {
    const sectors = Array.from({ length: SECTOR_COLORS.length }, (_, i) => `Sector ${String.fromCharCode(65 + i)}`);
    const store = setup({ commerces: sectors.map((sector, i) => commerce(`C${i}`, sector)) });
    const colors = sectors.map((sector) => store.sectorColor(sector));

    expect(new Set(colors).size).toBe(SECTOR_COLORS.length);
    expect(colors).toEqual(SECTOR_COLORS);
  });

  it('no cambia el color de un sector al aparecer otro con un nombre posterior', () => {
    const store = setup({ commerces: [commerce('1', 'Calzado'), commerce('2', 'Moda')] });
    const calzado = store.sectorColor('Calzado');
    store.commerces.set([...store.commerces(), commerce('3', 'Zapatería')]);
    expect(store.sectorColor('Calzado')).toBe(calzado);
  });

  it('los comercios sin sector llevan un color neutro', () => {
    expect(setup().sectorColor('  ')).toBe(NO_SECTOR_COLOR);
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

  it('cuenta las altas y las bajas de los últimos 7 días', () => {
    const day = 24 * 60 * 60 * 1000;
    const entry = (ago: number, added: number, removed = 0) => ({
      timestamp: new Date(Date.now() - ago * day).toISOString(),
      countAfter: 0,
      added: Array.from({ length: added }, (_, i) => `n${i}`),
      removed: Array.from({ length: removed }, (_, i) => `b${i}`)
    });
    const store = setup({ history: [entry(1, 5, 1), entry(6, 3, 2), entry(10, 100, 50)] });
    expect(store.recentAdded()).toBe(8);
    expect(store.recentRemoved()).toBe(3);
  });

  describe('arranque en frío del API', () => {
    function coldSetup(failures: number, retryDelaysMs: number[], hintAfterMs = 60000) {
      let calls = 0;
      const service = {
        // defer: cada (re)suscripción cuenta como una petición, igual que con HttpClient
        getCommerces: () =>
          defer(() => {
            calls++;
            return calls <= failures ? throwError(() => new Error('dormido')) : of([commerce('A', 'Moda')]);
          }),
        getStatus: () => of(null),
        getHistory: () => of([])
      };
      TestBed.configureTestingModule({
        providers: [
          Edition2026Store,
          { provide: CommerceService, useValue: service },
          { provide: COLD_START_CONFIG, useValue: { retryDelaysMs, hintAfterMs } }
        ]
      });
      return { store: TestBed.inject(Edition2026Store), calls: () => calls };
    }

    it('reintenta tras un fallo, avisa de que está despertando y acaba cargando', fakeAsync(() => {
      const { store, calls } = coldSetup(2, [1000, 2000]);
      expect(store.loading()).toBeTrue();
      expect(store.waking()).toBeTrue();
      tick(1000);
      expect(calls()).toBe(2);
      expect(store.loading()).toBeTrue();
      tick(2000);
      expect(calls()).toBe(3);
      expect(store.commerces().length).toBe(1);
      expect(store.loading()).toBeFalse();
      expect(store.waking()).toBeFalse();
      expect(store.error()).toBeFalse();
    }));

    it('agota los reintentos y marca error', fakeAsync(() => {
      const { store, calls } = coldSetup(99, [1000, 1000]);
      tick(2000);
      expect(calls()).toBe(3);
      expect(store.error()).toBeTrue();
      expect(store.loading()).toBeFalse();
      expect(store.waking()).toBeFalse();
    }));

    it('avisa de que tarda si la primera respuesta se retrasa', fakeAsync(() => {
      const { store } = coldSetup(0, [], 100);
      // respuesta síncrona del mock: ya cargó y el aviso no llega a salir
      expect(store.loading()).toBeFalse();
      expect(store.waking()).toBeFalse();
      tick(200);
      expect(store.waking()).toBeFalse();
    }));

    it('reload() vuelve a pedir los datos tras un error', fakeAsync(() => {
      const { store, calls } = coldSetup(1, []);
      expect(store.error()).toBeTrue();
      store.reload();
      expect(calls()).toBe(2);
      expect(store.error()).toBeFalse();
      expect(store.commerces().length).toBe(1);
    }));
  });
});
