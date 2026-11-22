import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { CommerceStatus } from '../../models/commerce-status.model';
import { ConsentService } from '../../services/consent.service';
import { LanguageService } from '../../services/language.service';
import { Edition2026ShellComponent } from './edition-2026.shell';
import { Edition2026Store } from './edition-2026.store';

function setup(status: CommerceStatus | null): ComponentFixture<Edition2026ShellComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [Edition2026ShellComponent],
    providers: [
      provideRouter([]),
      provideTranslateService(),
      { provide: Edition2026Store, useValue: { status: signal(status) } },
      { provide: ConsentService, useValue: { reopen: () => undefined } },
      {
        provide: LanguageService,
        useValue: {
          currentLocale: signal('es-ES'),
          currentCode: () => 'es',
          languages: [{ code: 'es', label: 'Castellano', locale: 'es-ES' }],
          setLanguage: () => Promise.resolve()
        }
      }
    ]
  });
  const fixture = TestBed.createComponent(Edition2026ShellComponent);
  fixture.detectChanges();
  return fixture;
}

const banner = (fixture: ComponentFixture<Edition2026ShellComponent>): Element | null =>
  (fixture.nativeElement as HTMLElement).querySelector('.shell__demo');

describe('Edition2026ShellComponent · aviso de demostración', () => {
  it('con el API en modo mock avisa de que son datos de demostración', () => {
    const fixture = setup({ environment: 'prod', total: 32, lastUpdate: '2026-11-20T00:00:00Z', mode: 'mock' });
    expect(banner(fixture)?.textContent).toContain('ed26.demo.banner');
    expect(banner(fixture)?.getAttribute('role')).toBe('note');
  });

  it('con datos reales no muestra el aviso', () => {
    expect(banner(setup({ environment: 'prod', total: 150, lastUpdate: null, mode: 'live' }))).toBeNull();
  });

  it('con un API anterior (sin `mode`) o sin estado todavía, tampoco', () => {
    expect(banner(setup({ environment: 'prod', total: 150, lastUpdate: null }))).toBeNull();
    expect(banner(setup(null))).toBeNull();
  });
});
