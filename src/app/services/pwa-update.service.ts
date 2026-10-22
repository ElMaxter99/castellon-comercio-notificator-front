import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first, switchMap } from 'rxjs';

/**
 * Con el service worker, tras un despliegue el navegador sigue sirviendo la versión anterior hasta
 * recargar. Cuando la nueva está lista, la activamos y recargamos en la *siguiente navegación*
 * (nunca a mitad de lo que el usuario esté haciendo en una página).
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly updates = inject(SwUpdate);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  start(): void {
    if (!this.updates.isEnabled) {
      return;
    }
    this.updates.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        switchMap(() =>
          this.router.events.pipe(
            filter((event): event is NavigationStart => event instanceof NavigationStart),
            first()
          )
        )
      )
      .subscribe((navigation) => {
        void this.updates.activateUpdate().finally(() => this.reload(navigation.url));
      });
  }

  /** Visible para los tests: la recarga real no se puede hacer en Karma. */
  protected reload(url: string): void {
    this.document.location.assign(url);
  }
}
