import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectorSummary } from '../edition-2026.store';
import { ShopsMapComponent } from './shops-map.component';

const SECTORS: SectorSummary[] = [
  { name: 'Calzado', count: 2, color: '#1E4D2B' },
  { name: 'Moda', count: 1, color: '#F77F00' }
];

function setup(inputs: Partial<ShopsMapComponent> = {}): ComponentFixture<ShopsMapComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [ShopsMapComponent] });
  const fixture = TestBed.createComponent(ShopsMapComponent);
  Object.assign(fixture.componentInstance, { commerces: [], sectors: SECTORS, ...inputs });
  fixture.detectChanges();
  return fixture;
}

const root = (f: ComponentFixture<ShopsMapComponent>): HTMLElement => f.nativeElement as HTMLElement;

/** La leyenda arranca abierta o plegada según el ancho de pantalla: se fuerza abierta. */
function openLegend(fixture: ComponentFixture<ShopsMapComponent>): void {
  const toggle = root(fixture).querySelector<HTMLElement>('.legend__toggle')!;
  if (toggle.getAttribute('aria-expanded') !== 'true') {
    toggle.click();
    fixture.detectChanges();
  }
}

describe('ShopsMapComponent · leyenda', () => {
  it('no pinta la leyenda si no hay sectores', () => {
    expect(root(setup({ sectors: [] })).querySelector('.legend')).toBeNull();
  });

  it('el botón pliega y despliega la lista de sectores', () => {
    const fixture = setup();
    const toggle = root(fixture).querySelector<HTMLElement>('.legend__toggle')!;
    const before = toggle.getAttribute('aria-expanded');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).not.toBe(before);
  });

  it('Esc cierra la leyenda abierta y devuelve el foco a su botón', () => {
    const fixture = setup();
    openLegend(fixture);
    const toggle = root(fixture).querySelector<HTMLElement>('.legend__toggle')!;
    root(fixture).querySelector('.legend__chip')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('lista «Todos», un chip por sector con su recuento y el filtro de favoritos', () => {
    const fixture = setup({ favoritesCount: 3 });
    openLegend(fixture);
    const chips = [...root(fixture).querySelectorAll('.legend__chip')].map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim());

    expect(chips.length).toBe(4); // todos + favoritos + 2 sectores
    expect(chips[1]).toContain('3'); // favoritos
    expect(chips[2]).toContain('Calzado');
    expect(chips[2]).toContain('2');
  });

  it('marca como pulsado el sector activo y «Todos» cuando no hay ninguno', () => {
    const fixture = setup({ activeSector: 'Moda' });
    openLegend(fixture);
    const chips = root(fixture).querySelectorAll('.legend__chip');
    expect(chips[0].getAttribute('aria-pressed')).toBe('false');
    expect(chips[3].getAttribute('aria-pressed')).toBe('true');

    const none = setup();
    openLegend(none);
    expect(root(none).querySelectorAll('.legend__chip')[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('pulsar un sector, «Todos» o favoritos emite el cambio', () => {
    const fixture = setup();
    const picked: string[] = [];
    let favorites = 0;
    fixture.componentInstance.sectorPicked.subscribe((name) => picked.push(name));
    fixture.componentInstance.favoritesToggled.subscribe(() => favorites++);
    openLegend(fixture);

    const chips = root(fixture).querySelectorAll<HTMLElement>('.legend__chip');
    chips[2].click();
    chips[0].click();
    chips[1].click();

    expect(picked).toEqual(['Calzado', '']);
    expect(favorites).toBe(1);
  });

  it('el botón muestra cuántos filtros hay activos', () => {
    const fixture = setup({ activeSector: 'Moda', onlyFavorites: true });
    expect(root(fixture).querySelector('.legend__count')?.textContent?.trim()).toBe('2');
    expect(root(setup()).querySelector('.legend__count')).toBeNull();
  });

  describe('según el ancho de pantalla', () => {
    const stubViewport = (desktop: boolean): void => {
      spyOn(window, 'matchMedia').and.returnValue({
        matches: desktop,
        addEventListener: () => undefined,
        removeEventListener: () => undefined
      } as unknown as MediaQueryList);
    };

    it('en móvil arranca plegada, con botón redondo y cabecera con «cerrar» al abrirla', () => {
      stubViewport(false);
      const fixture = setup();
      const el = root(fixture);
      expect(el.querySelector('.legend')?.classList).toContain('is-mobile');
      expect(el.querySelector('.legend__panel')).toBeNull();

      el.querySelector<HTMLElement>('.legend__toggle')!.click();
      fixture.detectChanges();
      expect(el.querySelector('.legend__head')).not.toBeNull();

      el.querySelector<HTMLElement>('.legend__close')!.click();
      fixture.detectChanges();
      expect(el.querySelector('.legend__panel')).toBeNull();
    });

    it('en móvil, elegir un sector o favoritos cierra la hoja para ver el mapa', () => {
      stubViewport(false);
      const fixture = setup();
      const el = root(fixture);
      const picked: string[] = [];
      fixture.componentInstance.sectorPicked.subscribe((name) => picked.push(name));

      el.querySelector<HTMLElement>('.legend__toggle')!.click();
      fixture.detectChanges();
      el.querySelectorAll<HTMLElement>('.legend__chip')[2].click();
      fixture.detectChanges();
      expect(picked).toEqual(['Calzado']);
      expect(el.querySelector('.legend__panel')).toBeNull();

      el.querySelector<HTMLElement>('.legend__toggle')!.click();
      fixture.detectChanges();
      el.querySelector<HTMLElement>('.legend__chip--fav')!.click();
      fixture.detectChanges();
      expect(el.querySelector('.legend__panel')).toBeNull();
    });

    it('en escritorio arranca abierta, sin cabecera y sigue abierta tras elegir', () => {
      stubViewport(true);
      const fixture = setup();
      const el = root(fixture);
      expect(el.querySelector('.legend')?.classList).not.toContain('is-mobile');
      expect(el.querySelector('.legend__panel')).not.toBeNull();
      expect(el.querySelector('.legend__head')).toBeNull();

      el.querySelectorAll<HTMLElement>('.legend__chip')[2].click();
      fixture.detectChanges();
      expect(el.querySelector('.legend__panel')).not.toBeNull();
    });
  });
});
