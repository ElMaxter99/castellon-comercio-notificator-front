import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { CommerceStatusComponent } from './components/commerce-status/commerce-status.component';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    TranslateModule,
    CommerceStatusComponent,
    LanguageSwitcherComponent,
    ToastContainerComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly router = inject(Router);

  protected readonly isLive = environment.isLive;
  protected readonly isHistoryRoute = signal(false);

  constructor() {
    this.updateRouteState(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.updateRouteState(event.urlAfterRedirects);
      });
  }

  private updateRouteState(url: string): void {
    this.isHistoryRoute.set(url.startsWith('/history'));
  }
}
