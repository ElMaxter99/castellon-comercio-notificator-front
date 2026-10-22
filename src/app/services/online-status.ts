import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

/** ¿Hay conexión? Se actualiza con los eventos `online`/`offline` del navegador. */
@Injectable({ providedIn: 'root' })
export class OnlineStatus {
  private readonly window = inject(DOCUMENT).defaultView;
  readonly online = signal(this.window?.navigator?.onLine ?? true);

  constructor() {
    this.window?.addEventListener('online', () => this.online.set(true));
    this.window?.addEventListener('offline', () => this.online.set(false));
  }
}
