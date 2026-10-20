import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { disablePageZoom } from './app/utils/disable-page-zoom';

// La analítica de Vercel NO se inyecta aquí: la carga ConsentService solo tras aceptar las cookies.
disablePageZoom();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
