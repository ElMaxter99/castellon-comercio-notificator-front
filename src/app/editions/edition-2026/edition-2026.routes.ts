import { Routes } from '@angular/router';
import { Edition2026Store } from './edition-2026.store';

export const edition2026Routes: Routes = [
  {
    path: '',
    providers: [Edition2026Store],
    loadComponent: () => import('./edition-2026.shell').then((m) => m.Edition2026ShellComponent),
    children: [
      {
        path: '',
        data: { titleKey: 'title.home' },
        loadComponent: () => import('./pages/home.page').then((m) => m.HomePageComponent)
      },
      {
        path: 'comercios',
        data: { titleKey: 'title.shops' },
        loadComponent: () => import('./pages/shops.page').then((m) => m.ShopsPageComponent)
      },
      {
        path: 'novedades',
        data: { titleKey: 'title.news' },
        loadComponent: () => import('./pages/news.page').then((m) => m.NewsPageComponent)
      },
      { path: '**', redirectTo: '' }
    ]
  }
];
