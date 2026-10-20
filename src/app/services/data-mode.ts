import { InjectionToken } from '@angular/core';

export type DataMode = 'demo' | 'live';

/**
 * Fuerza el origen de datos de un árbol de rutas.
 * Si no se provee, `CommerceService` usa `environment.isLive`.
 */
export const DATA_MODE = new InjectionToken<DataMode>('DATA_MODE');
