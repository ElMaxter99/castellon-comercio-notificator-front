import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { CommerceStatusComponent } from '../../components/commerce-status/commerce-status.component';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { DATA_MODE } from '../../services/data-mode';

/** Edición 2025: layout original de la aplicación, siempre en modo DEMO. */
@Component({
  selector: 'app-edition-2025-shell',
  imports: [CommonModule, RouterOutlet, RouterLink, TranslatePipe, CommerceStatusComponent, LanguageSwitcherComponent],
  templateUrl: './edition-2025.shell.html',
  styleUrl: './edition-2025.shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Edition2025ShellComponent {
  private readonly router = inject(Router);

  protected readonly isLive = inject(DATA_MODE, { optional: true }) === 'live';
  protected readonly isHistoryRoute = signal(false);

  constructor() {
    this.updateRouteState(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => this.updateRouteState(event.urlAfterRedirects));
  }

  private updateRouteState(url: string): void {
    this.isHistoryRoute.set(url.startsWith('/2025/history'));
  }
}
