import { Injectable, computed, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export interface SupportedLanguage {
  code: string;
  label: string;
  locale: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly storageKey = 'castellon-comercio-language';

  private readonly supportedLanguages: SupportedLanguage[] = [
    { code: 'es', label: 'Castellano', locale: 'es-ES' },
    { code: 'ca-ES-valencia', label: 'Valencià', locale: 'ca-ES-valencia' }
  ];

  private readonly activeLanguage = signal<SupportedLanguage>(this.supportedLanguages[0]);

  readonly currentLanguage = computed(() => this.activeLanguage());
  readonly currentLocale = computed(() => this.activeLanguage().locale);
  readonly currentCode = computed(() => this.activeLanguage().code);

  constructor(private readonly translate: TranslateService) {
    this.translate.addLangs(this.supportedLanguages.map((language) => language.code));
    this.translate.setDefaultLang(this.supportedLanguages[0].code);

    const initialCode = this.resolveInitialLanguage();
    void this.setLanguage(initialCode);
  }

  get languages(): readonly SupportedLanguage[] {
    return this.supportedLanguages;
  }

  async setLanguage(code: string): Promise<void> {
    const targetLanguage = this.findLanguage(code) ?? this.supportedLanguages[0];

    try {
      if (this.translate.currentLang !== targetLanguage.code) {
        await firstValueFrom(this.translate.use(targetLanguage.code));
      }
      this.updateActiveLanguage(targetLanguage, true);
    } catch (error) {
      const fallback = this.supportedLanguages[0];
      await firstValueFrom(this.translate.use(fallback.code));
      this.updateActiveLanguage(fallback, true);
    }
  }

  private resolveInitialLanguage(): string {
    const stored = this.getStoredLanguage();
    if (stored) {
      return stored;
    }

    const browserLanguage = (this.translate.getBrowserCultureLang() ?? '').toLowerCase();
    const matched = this.supportedLanguages.find((language) => {
      const code = language.code.toLowerCase();
      return browserLanguage === code || browserLanguage.startsWith(code.split('-')[0]);
    });

    return matched?.code ?? this.supportedLanguages[0].code;
  }

  private findLanguage(code: string): SupportedLanguage | undefined {
    const normalised = (code ?? '').toLowerCase();
    return this.supportedLanguages.find((language) => language.code.toLowerCase() === normalised);
  }

  private updateActiveLanguage(language: SupportedLanguage, persist: boolean): void {
    this.activeLanguage.set(language);
    this.updateDocumentLanguage(language.code);
    if (persist) {
      this.storeLanguage(language.code);
    }
  }

  private getStoredLanguage(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage.getItem(this.storageKey);
    } catch (error) {
      return null;
    }
  }

  private storeLanguage(code: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey, code);
    } catch (error) {
      // Ignore persistence errors (e.g. private browsing mode)
    }
  }

  private updateDocumentLanguage(code: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.lang = code;
  }
}
