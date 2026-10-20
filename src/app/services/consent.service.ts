import { Injectable, signal } from '@angular/core';

export type ConsentChoice = 'granted' | 'denied';

const STORAGE_KEY = 'castellon-comercio-consent-v1';

/**
 * Consentimiento para las cookies/tecnologías NO necesarias (hoy solo la analítica de
 * Vercel). El idioma, los favoritos y esta misma preferencia son almacenamiento técnico
 * y no requieren consentimiento (art. 22.2 LSSI). Hasta que el usuario acepte, no se
 * carga ningún script de analítica.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly stored = signal<ConsentChoice | null>(this.read());
  private readonly panel = signal(false);
  private analyticsLoaded = false;

  /** Decisión guardada (null si aún no ha elegido). */
  readonly choice = this.stored.asReadonly();
  /** El banner se muestra mientras no haya decisión o si el usuario pide cambiarla. */
  readonly bannerVisible = () => this.stored() === null || this.panel();

  constructor() {
    if (this.stored() === 'granted') {
      this.loadAnalytics();
    }
  }

  accept(): void {
    this.save('granted');
    this.loadAnalytics();
  }

  reject(): void {
    const wasLoaded = this.analyticsLoaded;
    this.save('denied');
    if (wasLoaded) {
      // El script ya está en la página: se recarga para que deje de ejecutarse.
      window.location.reload();
    }
  }

  /** Reabre el banner para cambiar la decisión (enlace «Gestionar cookies»). */
  reopen(): void {
    this.panel.set(true);
  }

  protected loadAnalytics(): void {
    if (this.analyticsLoaded) {
      return;
    }
    this.analyticsLoaded = true;
    void import('@vercel/analytics').then((module) => module.inject());
  }

  private save(choice: ConsentChoice): void {
    this.stored.set(choice);
    this.panel.set(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Sin almacenamiento: la decisión solo vale para esta visita.
    }
  }

  private read(): ConsentChoice | null {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'granted' || value === 'denied' ? value : null;
    } catch {
      return null;
    }
  }
}
