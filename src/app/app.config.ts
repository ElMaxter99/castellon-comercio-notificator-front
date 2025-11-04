import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule, Translation } from '@ngx-translate/core';
import { Observable } from 'rxjs';

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
    provideHttpClient(withFetch()),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),
  ],
};
