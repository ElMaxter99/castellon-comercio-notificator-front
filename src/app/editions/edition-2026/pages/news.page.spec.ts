import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { CommerceHistoryEntry } from '../../../models/commerce-history-entry.model';
import { LanguageService } from '../../../services/language.service';
import { Edition2026Store } from '../edition-2026.store';
import { NewsPageComponent } from './news.page';

const names = (prefix: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`);

const entry = (
  timestamp: string,
  added: string[],
  removed: string[] = [],
  countAfter = 100,
  modified?: CommerceHistoryEntry['modified']
): CommerceHistoryEntry => ({
  timestamp,
  added,
  removed,
  countAfter,
  ...(modified ? { modified } : {})
});

function setup(history: CommerceHistoryEntry[]): ComponentFixture<NewsPageComponent> {
  TestBed.configureTestingModule({
    imports: [NewsPageComponent],
    providers: [
      provideTranslateService(),
      { provide: Edition2026Store, useValue: { history: signal(history) } },
      { provide: LanguageService, useValue: { currentLocale: signal('es-ES') } }
    ]
  });
  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('es', {
    ed26: {
      news: {
        week: 'Semana del {{start}} al {{end}}',
        thisWeek: 'Esta semana',
        fields: { phone: 'teléfono', address: 'dirección' }
      }
    }
  });
  translate.use('es');
  const fixture = TestBed.createComponent(NewsPageComponent);
  fixture.detectChanges();
  return fixture;
}

const html = (fixture: ComponentFixture<NewsPageComponent>): HTMLElement => fixture.nativeElement as HTMLElement;
const click = (fixture: ComponentFixture<NewsPageComponent>, selector: string, index = 0): void => {
  html(fixture).querySelectorAll<HTMLElement>(selector)[index].click();
  fixture.detectChanges();
};

describe('NewsPageComponent', () => {
  const history = [
    entry('2026-10-19T10:00:00Z', names('Nuevo', 20), ['Baja 1', 'Baja 2'], 270),
    entry('2026-10-12T10:00:00Z', ['Panadería'], [], 70),
    entry('2026-09-28T10:00:00Z', ['Librería'], [], 69),
    entry('2026-09-01T10:00:00Z', [], [], 68) // sin cambios: no se muestra
  ];

  it('muestra el estado vacío cuando no hay altas ni bajas', () => {
    const fixture = setup([entry('2026-10-01T10:00:00Z', [], [])]);
    expect(html(fixture).querySelector('.ed26-state')).not.toBeNull();
    expect(html(fixture).querySelector('.news__month-toggle')).toBeNull();
  });

  it('agrupa por semana (lunes a domingo) con el resumen de altas y bajas, la más reciente primero', () => {
    const fixture = setup(history);
    const weeks = html(fixture).querySelectorAll('.news__month-toggle');
    expect(weeks.length).toBe(3);
    expect(weeks[0].textContent).toContain('+20');
    expect(weeks[0].textContent).toContain('−2');
    expect(weeks[1].textContent).toContain('+1');
    expect(weeks[0].textContent).toContain('Semana del 19 al 25 oct 2026');
  });

  it('dos entradas de la misma semana van en el mismo grupo, aunque sean de meses distintos', () => {
    const fixture = setup([
      entry('2026-10-01T10:00:00Z', ['A']), // jueves
      entry('2026-09-30T10:00:00Z', ['B']), // miércoles, misma semana (28 sep – 4 oct)
      entry('2026-10-05T10:00:00Z', ['C']) // lunes: semana siguiente
    ]);
    expect(html(fixture).querySelectorAll('.news__month-toggle').length).toBe(2);
  });

  it('solo despliega la semana más reciente y su última entrada', () => {
    const fixture = setup(history);
    const toggles = html(fixture).querySelectorAll<HTMLElement>('.news__month-toggle');
    expect(toggles[0].getAttribute('aria-expanded')).toBe('true');
    expect(toggles[1].getAttribute('aria-expanded')).toBe('false');

    const cards = html(fixture).querySelectorAll('.news__card-head');
    expect(cards.length).toBe(1);
    expect(cards[0].getAttribute('aria-expanded')).toBe('true');
    expect(html(fixture).querySelectorAll('.news__body').length).toBe(1);
  });

  it('limita a 8 los nombres visibles y permite ver todos', () => {
    const fixture = setup(history);
    const items = (): number => html(fixture).querySelectorAll('.news__names:not(.news__names--removed) li').length;
    expect(items()).toBe(8);

    click(fixture, '.news__more');
    expect(items()).toBe(20);

    click(fixture, '.news__more');
    expect(items()).toBe(8);
  });

  it('plegar y desplegar una semana cambia sus entradas visibles', () => {
    const fixture = setup(history);
    click(fixture, '.news__month-toggle', 0);
    expect(html(fixture).querySelectorAll('.news__card-head').length).toBe(0);

    click(fixture, '.news__month-toggle', 1);
    expect(html(fixture).querySelectorAll('.news__card-head').length).toBe(1);
  });

  it('«Desplegar todo» abre todas las semanas y entradas, y «Plegar todo» las cierra', () => {
    const fixture = setup(history);
    click(fixture, '.news__expand');
    expect(html(fixture).querySelectorAll('.news__card-head').length).toBe(3);
    expect(html(fixture).querySelectorAll('.news__body').length).toBe(3);

    click(fixture, '.news__expand');
    expect(html(fixture).querySelectorAll('.news__card-head').length).toBe(0);
  });

  describe('rótulo de la semana', () => {
    const label = (timestamp: string): string => {
      const fixture = setup([entry(timestamp, ['X'])]);
      return (html(fixture).querySelector('.news__month-name')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    };

    it('compacta el rango dentro de un mismo mes', () => {
      expect(label('2026-10-21T10:00:00Z')).toBe('Semana del 19 al 25 oct 2026');
    });

    it('repite el mes cuando la semana cruza de mes', () => {
      expect(label('2026-09-30T10:00:00Z')).toBe('Semana del 28 sept al 4 oct 2026');
    });

    it('repite el año cuando la semana cruza de año', () => {
      expect(label('2026-01-01T10:00:00Z')).toBe('Semana del 29 dic 2025 al 4 ene 2026');
    });
  });

  describe('semana en curso', () => {
    it('marca solo la semana actual con «Esta semana»', () => {
      const now = new Date();
      const old = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
      const fixture = setup([entry(now.toISOString(), ['A']), entry(old.toISOString(), ['B'])]);
      const tags = html(fixture).querySelectorAll('.news__current');
      expect(tags.length).toBe(1);
      expect(tags[0].textContent).toContain('Esta semana');
      expect(html(fixture).querySelectorAll('.news__month-toggle')[0].contains(tags[0])).toBeTrue();
    });

    it('no marca ninguna si todas las entradas son antiguas', () => {
      const fixture = setup([entry('2020-03-04T10:00:00Z', ['A'])]);
      expect(html(fixture).querySelector('.news__current')).toBeNull();
    });
  });

  describe('comercios actualizados', () => {
    const modifiedEntry = entry('2026-10-21T10:00:00Z', [], [], 100, [
      { name: 'Bar Pepe', changes: ['phone', 'address'] },
      { name: 'Zapatería Sol', changes: ['campo-nuevo'] }
    ]);

    it('una entrada que solo trae modificaciones aparece, con su insignia ±N', () => {
      const fixture = setup([modifiedEntry]);
      expect(html(fixture).querySelectorAll('.news__card-head').length).toBe(1);
      expect(html(fixture).querySelector('.news__card-head .news__badge--mod')?.textContent).toContain('±2');
      expect(html(fixture).querySelector('.news__month-toggle .news__badge--mod')?.textContent).toContain('±2');
    });

    it('lista cada comercio con los campos cambiados e ignora los campos desconocidos', () => {
      const fixture = setup([modifiedEntry]);
      const items = [...html(fixture).querySelectorAll('.news__names--modified li')];
      expect(items.length).toBe(2);
      expect(items[0].textContent).toContain('Bar Pepe');
      expect([...items[0].querySelectorAll('.news__change')].map((c) => c.textContent?.trim())).toEqual([
        'teléfono',
        'dirección'
      ]);
      expect(items[1].querySelectorAll('.news__change').length).toBe(0);
    });

    it('las entradas antiguas, sin `modified`, siguen funcionando', () => {
      const fixture = setup([entry('2026-10-21T10:00:00Z', ['A'])]);
      expect(html(fixture).querySelector('.news__badge--mod')).toBeNull();
      expect(html(fixture).querySelector('.news__names--modified')).toBeNull();
    });
  });
});
