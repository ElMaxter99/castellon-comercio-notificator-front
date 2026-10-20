/**
 * URL base del API configurable en tiempo de compilación.
 *
 * Se inyecta con la opción `define` del builder de Angular (`API_BASE_URL`):
 *  - variable de entorno `API_BASE_URL` al ejecutar `npm start|build` o `ng ...`
 *  - o flag `--api-url=https://...` (ver tools/ng-live.cjs y docs/ENVIRONMENTS-AND-MOCK.md)
 * Si no se define, se usa el valor por defecto de cada fichero de entorno.
 */
declare const API_BASE_URL: string | undefined;

export function resolveApiBaseUrl(fallback: string): string {
  const configured = typeof API_BASE_URL === 'string' ? API_BASE_URL.trim() : '';
  return (configured || fallback).replace(/\/+$/, '');
}
