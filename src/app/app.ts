import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieBannerComponent } from './components/cookie-banner/cookie-banner.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, CookieBannerComponent],
  template: `<router-outlet></router-outlet><app-toast-container></app-toast-container><app-cookie-banner></app-cookie-banner>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
