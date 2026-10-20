import { Routes } from '@angular/router';
import { CommerceService } from './services/commerce.service';
import { DATA_MODE } from './services/data-mode';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Comerç Castelló · Abonem Castelló',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPageComponent)
  },
  {
    // Edición 2025: vistas originales, siempre con datos de demostración.
    path: '2025',
    title: 'Comerç Castelló · Edición 2025 (demo)',
    providers: [{ provide: DATA_MODE, useValue: 'demo' }, CommerceService],
    loadComponent: () =>
      import('./editions/edition-2025/edition-2025.shell').then((m) => m.Edition2025ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/commerce-grid/commerce-grid.component').then((m) => m.CommerceGridComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./pages/history/history.page').then((m) => m.HistoryPageComponent)
      }
    ]
  },
  {
    // Edición 2026: vistas renovadas (ver docs/EDITIONS.md).
    path: '2026',
    title: 'Comerç Castelló · Edición 2026',
    loadChildren: () => import('./editions/edition-2026/edition-2026.routes').then((m) => m.edition2026Routes)
  },
  { path: 'history', redirectTo: '2025/history' },
  { path: '**', redirectTo: '' }
];
