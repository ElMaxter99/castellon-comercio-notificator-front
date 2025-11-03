import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { CommerceStatusComponent } from './components/commerce-status/commerce-status.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommerceStatusComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly router = inject(Router);

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
