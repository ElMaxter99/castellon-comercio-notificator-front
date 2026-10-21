import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { AppTitleStrategy } from './title.strategy';

@Component({ template: '' })
class BlankComponent {}

describe('AppTitleStrategy', () => {
  async function setup(): Promise<{ harness: RouterTestingHarness; translate: TranslateService }> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'inicio', component: BlankComponent, data: { titleKey: 'title.home' } },
          {
            path: 'edicion',
            data: { titleKey: 'title.edition' },
            children: [{ path: 'hija', component: BlankComponent }]
          },
          { path: 'sin-clave', component: BlankComponent }
        ]),
        provideTranslateService(),
        { provide: TitleStrategy, useClass: AppTitleStrategy }
      ]
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', { title: { home: 'Inicio · Castellón', edition: 'Edición 2026' } });
    translate.setTranslation('ca', { title: { home: 'Inici · Castelló', edition: 'Edició 2026' } });
    translate.use('es');
    return { harness: await RouterTestingHarness.create(), translate };
  }

  it('pone el título traducido de la ruta', async () => {
    const { harness } = await setup();
    await harness.navigateByUrl('/inicio');
    expect(TestBed.inject(Title).getTitle()).toBe('Inicio · Castellón');
  });

  it('una ruta hija hereda el título de su padre', async () => {
    const { harness } = await setup();
    await harness.navigateByUrl('/edicion/hija');
    expect(TestBed.inject(Title).getTitle()).toBe('Edición 2026');
  });

  it('al cambiar de idioma se vuelve a traducir el título', async () => {
    const { harness, translate } = await setup();
    await harness.navigateByUrl('/inicio');
    translate.use('ca');
    await new Promise((resolve) => setTimeout(resolve));
    expect(TestBed.inject(Title).getTitle()).toBe('Inici · Castelló');
  });

  it('sin `titleKey` no toca el título', async () => {
    const { harness } = await setup();
    await harness.navigateByUrl('/inicio');
    await harness.navigateByUrl('/sin-clave');
    expect(TestBed.inject(Router).url).toBe('/sin-clave');
    expect(TestBed.inject(Title).getTitle()).toBe('Inicio · Castellón');
  });
});
