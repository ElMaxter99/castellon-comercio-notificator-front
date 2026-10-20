import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// La analítica de Vercel NO se inyecta aquí: la carga ConsentService solo tras aceptar las cookies.
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
