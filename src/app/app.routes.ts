import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/commerce-grid/commerce-grid.component').then((m) => m.CommerceGridComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history/history.page').then((m) => m.HistoryPageComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
