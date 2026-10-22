import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import packageInfo from '../../../../package.json';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { ConsentService } from '../../services/consent.service';
import { LanguageService } from '../../services/language.service';
import { formatDate } from '../../utils/format-date';
import { Edition2026Store } from './edition-2026.store';

@Component({
  selector: 'app-edition-2026-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './edition-2026.shell.html',
  styleUrl: './edition-2026.shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Edition2026ShellComponent {
  private readonly store = inject(Edition2026Store);
  private readonly language = inject(LanguageService);
  protected readonly consent = inject(ConsentService);
  private readonly router = inject(Router);
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');
  private lastPath: string | null = null;

  constructor() {
    // Al cambiar de página (no de filtros: esos solo cambian la query) el foco pasa al contenido,
    // para que teclado y lectores de pantalla no se queden en el enlace de la cabecera.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        const changed = this.lastPath !== null && path !== this.lastPath;
        this.lastPath = path;
        if (changed) {
          this.main()?.nativeElement.focus({ preventScroll: true });
        }
      });
  }

  /** «Saltar al contenido»: mueve el foco a <main> (el ancla #main no funciona con el router). */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main()?.nativeElement.focus();
  }

  protected readonly version = packageInfo.version ?? '';
  protected readonly lastUpdate = computed(() => {
    const value = this.store.status()?.lastUpdate;
    return value
      ? formatDate(value, this.language.currentLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '';
  });
}
