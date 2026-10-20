import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: `<router-outlet></router-outlet><app-toast-container></app-toast-container>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
