import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/**
 * Título de la pestaña por ruta y en el idioma activo. Cada ruta declara `data: { titleKey }`
 * (clave de `title.*` en los JSON de i18n); al cambiar de idioma el título se vuelve a traducir.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private key: string | null = null;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.apply());
    this.translate.onTranslationChange.subscribe(() => this.apply());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    // Se sube desde la ruta más profunda hasta encontrar una con `titleKey`
    let key: string | null = null;
    for (let current: typeof route | null = route; current; current = current.parent) {
      const value = current.data?.['titleKey'];
      if (typeof value === 'string') {
        key = value;
        break;
      }
    }
    this.key = key;
    this.apply();
  }

  private apply(): void {
    if (!this.key) {
      return;
    }
    const text = this.translate.instant(this.key);
    // Sin traducciones aún, `instant` devuelve la propia clave: no se pinta
    if (text && text !== this.key) {
      this.title.setTitle(text);
    }
  }
}
