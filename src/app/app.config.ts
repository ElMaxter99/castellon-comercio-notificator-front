import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { TitleStrategy, provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import {
  TranslateLoader,
  Translation,
  provideTranslateLoader,
  provideTranslateService,
} from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { PwaUpdateService } from './services/pwa-update.service';
import { AppTitleStrategy } from './services/title.strategy';
import { routes } from './app.routes';

class AssetTranslateLoader implements TranslateLoader {
  constructor(
    private readonly http: HttpClient,
    private readonly prefix = '/public/i18n/',
    private readonly suffix = '.json'
  ) {}

  getTranslation(lang: string): Observable<Translation> {
    const path = `${this.prefix}${lang}${this.suffix}`;
    return this.http.get<Translation>(path);
  }
}

export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new AssetTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withFetch()),
    // Solo en builds de producción/test (ngsw-config.json); en `ng serve` y en los tests queda desactivado.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideAppInitializer(() => inject(PwaUpdateService).start()),
    provideTranslateService({ fallbackLang: 'es' }),
    provideTranslateLoader((): TranslateLoader => createTranslateLoader(inject(HttpClient))),
  ],
};
