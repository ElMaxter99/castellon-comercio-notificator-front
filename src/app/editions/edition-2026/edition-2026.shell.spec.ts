import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ConsentService } from '../../services/consent.service';
import { LanguageService } from '../../services/language.service';
import { Edition2026ShellComponent } from './edition-2026.shell';
import { Edition2026Store } from './edition-2026.store';

async function setup(): Promise<{ fixture: ComponentFixture<Edition2026ShellComponent>; router: Router }> {
  TestBed.configureTestingModule({
    imports: [Edition2026ShellComponent],
    providers: [
      provideRouter([
        { path: '2026', children: [] },
        { path: '2026/comercios', children: [] },
        { path: '2026/novedades', children: [] }
      ]),
      provideTranslateService(),
      { provide: Edition2026Store, useValue: { status: signal(null) } },
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
  const router = TestBed.inject(Router);
  await router.navigateByUrl('/2026'); // primera navegación: no mueve el foco
  fixture.detectChanges();
  return { fixture, router };
}

const main = (fixture: ComponentFixture<Edition2026ShellComponent>): HTMLElement =>
  (fixture.nativeElement as HTMLElement).querySelector('main')!;

describe('Edition2026ShellComponent · accesibilidad', () => {
  it('es lo primero que se alcanza con Tab: un enlace «Saltar al contenido» que enfoca <main>', async () => {
    const { fixture } = await setup();
    const root = fixture.nativeElement as HTMLElement;
    const skip = root.querySelector<HTMLAnchorElement>('a.shell__skip')!;
    expect(root.querySelector('a, button')).toBe(skip);
    expect(skip.getAttribute('href')).toBe('#main');

    skip.click();
    expect(document.activeElement).toBe(main(fixture));
  });

  it('<main> se puede enfocar por código (tabindex -1)', async () => {
    const { fixture } = await setup();
    expect(main(fixture).getAttribute('tabindex')).toBe('-1');
    expect(main(fixture).id).toBe('main');
  });

  it('al cambiar de página el foco pasa al contenido; la primera carga no lo roba', async () => {
    const { fixture, router } = await setup();
    expect(document.activeElement).not.toBe(main(fixture));

    await router.navigateByUrl('/2026/novedades');
    expect(document.activeElement).toBe(main(fixture));
  });

  it('cambiar solo filtros (query) no mueve el foco', async () => {
    const { fixture, router } = await setup();
    await router.navigateByUrl('/2026/comercios');
    (document.activeElement as HTMLElement | null)?.blur();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    await router.navigateByUrl('/2026/comercios?q=bar&sector=Moda');
    expect(document.activeElement).toBe(input);
    expect(document.activeElement).not.toBe(main(fixture));
    input.remove();
  });
});
