# Entornos y modo mock

## Ficheros de entorno (`src/environments/`)
`environment.ts` es el que importa el código; `angular.json` lo reemplaza (`fileReplacements`) según la configuración.

| Configuración Angular | Reemplaza por | `mode` | `apiBaseUrl` | `isLive` |
|---|---|---|---|---|
| `development` (por defecto) | — (`environment.ts`) | development | `http://localhost:12001` | true |
| `development-mock` | `environment.mock.ts` | development-mock | `http://localhost:12001` | false |
| `production` | `environment.prod.ts` | production | `https://castellon-comercio-notificator-api.onrender.com` | true |
| `production-mock` | `environment.mock.prod.ts` | production-mock | idem | false |
| `test` | `environment.test.ts` | test | `https://castellon-comercio-notificator-api.onrender.com` | true |
| `test-mock` | `environment.mock.test.ts` | test-mock | idem | false |

> **Desde la v2.0.0** la edición 2025 (`/2025`) fuerza siempre el modo demo con el token `DATA_MODE`, ignorando `isLive`. Ver [EDITIONS.md](EDITIONS.md). `isLive` y `--live` solo gobiernan la edición 2026.

`isLive` decide en `CommerceService` si se llama al API o se leen los JSON de `public/mockup/`. Con `isLive=false` el layout muestra un aviso persistente ("datos ilustrativos").

## URL del API configurable (`API_BASE_URL` / `--api-url`)
Los valores de `apiBaseUrl` de la tabla son los **por defecto**. Para apuntar a tu propio API sin editar código:

```bash
# variable de entorno (válido también en Vercel/Render/CI: Project Settings → Environment Variables)
API_BASE_URL=https://mi-api.onrender.com npm run build -- --configuration=production

# o flag
npm start -- --api-url=http://localhost:3000
npm run build -- --configuration=production --api-url=https://mi-api.onrender.com
```
- Prioridad: flag `--api-url` > variable `API_BASE_URL` > valor por defecto del entorno.
- Debe ser una URL `http(s)://...` (si no, el wrapper aborta con un error). La barra final se elimina.
- Funciona con `npm start|build|watch` y con `ng build|serve` (el wrapper `tools/ng-live.cjs` añade `--define=API_BASE_URL="..."`). No aplica a `test`.
- Es **en tiempo de compilación**: tras cambiarla hay que volver a compilar/desplegar. En Vercel basta con definir `API_BASE_URL` y redesplegar.
- Solo afecta a las vistas en modo live (edición 2026); `/2025` es siempre demo y no llama al API.
- Cómo funciona: `angular.json` declara `define: { API_BASE_URL: "undefined" }`; `src/environments/api-url.ts` lee esa constante en `resolveApiBaseUrl(fallback)`.
- El API (repo `castellon-comercio-notificator-api`) tiene CORS abierto; si lo restringes, permite el dominio del front.

## El flag `--live`
`npm start|build|test` y los comandos `ng ...` pasan por `tools/ng-live.cjs`:
- `--live` ausente o `--live=true` → no cambia nada.
- `--live=false` (también `0|no|off`) → añade/convierte `--configuration` a la variante `-mock` (`development`→`development-mock`, `production`→`production-mock`...). Si no se indica configuración, usa `development` para `build`/`serve`.
- `tools/setup-ng-live.cjs` (postinstall) renombra `node_modules/.bin/ng` a `ng-real` y pone un wrapper (Unix y Windows) para que `ng build --live=false` funcione en pipelines (Vercel).

## Recetas
```bash
npm start                                   # API local :12001
npm start -- --live=false                   # mock
npm run build -- --configuration=production # prod real
npm run build -- --configuration=production --live=false  # demo con mock
# En CI/Vercel:
ng build --configuration=$NG_BUILD_CONFIG --live=false
```
Salida en `dist/castellon-comercio-notificator-front/` (builder `application`: contenido en `browser/`).

## Fixtures mock (`public/mockup/`)
- `commerces.json`: pocos comercios de ejemplo (6) con la forma de `Commerce`; sus `mapsUrl` deben incluir `query=lat,lng` para ver marcadores.
- `status.json`, `history.json`: formas de `CommerceStatus` y `CommerceHistoryEntry[]`.
Cambia estos ficheros para demos; no requieren compilar de nuevo el API.

## Presupuestos de build (producción)
Inicial: aviso 500 kB, error 1 MB. Estilos por componente: aviso 10 KB, error 15 KB.
