import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { Edition2026Store } from '../edition-2026.store';
import { HomePageComponent } from './home.page';

function setup(overrides: Record<string, unknown> = {}): ComponentFixture<HomePageComponent> {
  const store = {
    commerces: signal([{ name: 'A', sector: 'Moda' }]),
    sectors: signal([{ name: 'Moda', count: 1, color: '#111' }]),
    history: signal([]),
    status: signal(null),
    loading: signal(false),
    error: signal(false),
    recentAdded: signal(77),
    recentRemoved: signal(1),
    ...overrides
  };
  TestBed.configureTestingModule({
    imports: [HomePageComponent],
    providers: [
      provideRouter([]),
      provideTranslateService(),
      { provide: Edition2026Store, useValue: store },
      { provide: LanguageService, useValue: { currentLocale: signal('es-ES') } }
    ]
  });
  const fixture = TestBed.createComponent(HomePageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('HomePageComponent', () => {
  it('muestra las cinco métricas, incluidas las altas y las bajas de los últimos 7 días', () => {
    const el = setup().nativeElement as HTMLElement;
    const stats = [...el.querySelectorAll('.home__stat')].map((card) => ({
      label: card.querySelector('dt')?.textContent?.trim(),
      value: card.querySelector('dd')?.textContent?.replace(/\s+/g, '').trim()
    }));

    expect(stats.length).toBe(5);
    expect(stats[2]).toEqual({ label: 'ed26.home.stats.newLast7', value: '+77' });
    expect(stats[3]).toEqual({ label: 'ed26.home.stats.removedLast7', value: '−1' });
  });

  it('muestra «−0» cuando no ha habido bajas', () => {
    const el = setup({ recentRemoved: signal(0) }).nativeElement as HTMLElement;
    expect(el.querySelector('.home__stat--removed dd')?.textContent?.replace(/\s+/g, '')).toBe('−0');
  });

  it('un sector con un nombre muy largo no ensancha la página más allá de la pantalla', () => {
    const long = 'Alimentación, bebidas y productos de proximidad de temporada para toda la familia';
    const fixture = setup({
      sectors: signal([
        { name: long, count: 3, color: '#111' },
        { name: 'Moda', count: 1, color: '#222' }
      ])
    });
    // Se simula una pantalla de móvil: contenedor de 360 px con los estilos del componente aplicados
    const wrapper = document.createElement('div');
    wrapper.className = 'ed26'; // el tema (chips sin salto de línea) vive bajo .ed26
    wrapper.style.width = '360px';
    wrapper.append(fixture.nativeElement as HTMLElement);
    document.body.append(wrapper);

    const host = fixture.nativeElement as HTMLElement;
    for (const selector of ['.home__hero', '.home__stats', '.home__chips']) {
      expect(host.querySelector(selector)!.getBoundingClientRect().width).withContext(selector).toBeLessThanOrEqual(360);
    }

    wrapper.remove();
  });
});
