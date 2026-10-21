# CLAUDE.md — castellon-comercio-notificator-front

Guía para Claude Code. Léela entera antes de tocar nada.

## Qué es
SPA **Angular 22** (standalone + signals + OnPush) con **dos ediciones**: `/2025` (vistas originales, siempre demo) y `/2026` (vistas renovadas, ver `docs/EDITIONS.md`). Sirve para explorar los comercios adheridos al programa de bonos de Castelló de la Plana: filtros por nombre/sector/dirección, vista cuadrícula/lista, paginación, mapa Leaflet con leyenda por sectores, panel de estado y página de histórico de altas/bajas. Bilingüe (castellano / valencià). Consume el API del repo `castellon-comercio-notificator-api`. Despliegue de referencia: Vercel (usa `@vercel/analytics`).

Proyecto independiente y sin ánimo de lucro; sin relación oficial con el Ayuntamiento ni CONFECOMERÇ.

## Mapa rápido (`src/app/`)
| Ruta | Rol |
|---|---|
| `app.ts` | Solo `<router-outlet>` + toasts |
| `pages/landing/` | Selector de edición (`/`) |
| `editions/edition-2025/` | Shell del layout original (aviso demo, cabecera, estado). **No tocar el diseño** |
| `editions/edition-2026/` | Edición renovada: shell, store, páginas `home`/`shops`/`news`, tema `.ed26`, mapa propio |
| `services/data-mode.ts` | Token `DATA_MODE` que fuerza demo en el árbol 2025 |
| `app.routes.ts` | `''` landing; `2025` (demo forzado) con grid e historial; `2026` (lazy `edition2026Routes`); `history` → `2025/history` |
| `app.config.ts` | HttpClient(fetch), router, ngx-translate (loader propio desde `/public/i18n/`) |
| `services/commerce.service.ts` | **Único punto de acceso a datos**; alterna API real / mock con `environment.isLive` |
| `services/language.service.ts` | Idioma activo (signals), persistencia en `localStorage` |
| `services/toast.service.ts` | Notificaciones de error |
| `components/commerce-grid` | Pantalla principal: filtros, paginación, vista, orquesta mapa y tarjetas |
| `components/commerce-map` | Leaflet (global `window.L` desde CDN), marcadores por sector |
| `components/commerce-card`, `commerce-status`, `commerce-history`, `language-switcher`, `loading-spinner`, `toast-container` | UI reutilizable |
| `models/` | `Commerce`, `CommerceStatus`, `CommerceHistoryEntry` (deben reflejar el API) |
| `src/environments/` | 6 ficheros por modo (ver abajo) |
| `public/i18n/{es,ca-ES-valencia}.json` | Traducciones |
| `public/mockup/*.json` | Datos ficticios para modo mock |
| `tools/ng-live.cjs`, `tools/setup-ng-live.cjs` | Wrapper del CLI con flag `--live` |

## Documentación detallada (`docs/`)
- [`docs/EDITIONS.md`](docs/EDITIONS.md) — **ediciones 2025/2026**, modo demo forzado y diseño 2026.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — componentes, estado, flujos de datos, i18n, mapa.
- [`docs/ENVIRONMENTS-AND-MOCK.md`](docs/ENVIRONMENTS-AND-MOCK.md) — entornos, `--live`, modo mock, builds.
- [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md) — Dependabot: qué se ignora a propósito (jasmine 7…) y cómo revisar sus PRs.
- [`docs/REUSE-2026.md`](docs/REUSE-2026.md) — **checklist para reutilizar el proyecto en la edición 2026**.

## Comandos
```bash
npm install                      # postinstall instala el wrapper de `ng`
npm start                        # dev contra API real (http://localhost:12001)
npm start -- --live=false        # dev con datos mock (solo afecta a 2026; 2025 siempre es demo)
npm run build                    # build (config development por defecto)
npm run build -- --configuration=production
npm run build -- --configuration=production --live=false   # prod con mock
API_BASE_URL=https://mi-api.onrender.com npm run build -- --configuration=production   # API propio
npm start -- --api-url=http://localhost:3000                 # API local en otro puerto
npm test                         # Karma + Jasmine (51 tests: utils, CommerceService, popup, api-url, consentimiento, store y páginas de la edición 2026, app); CI en .github/workflows/ci.yml
```

## Convenciones
- Componentes `standalone`, `ChangeDetectionStrategy.OnPush`, estado con `signal`/`computed`, suscripciones con `takeUntilDestroyed()`.
- Prettier: `printWidth 100`, `singleQuote`. SCSS con BEM.
- **Todo texto visible va por ngx-translate**: añadir la clave en **ambos** JSON de `public/i18n/`.
- Los datos se piden siempre vía `CommerceService`, nunca `HttpClient` directo en componentes.
- Los PR deben pasar el CI (tests + builds). Añade tests para la lógica nueva (utils y servicios).
- Cada release: `CHANGELOG.md` + `version` en `package.json` (se muestra en el panel de estado). Gitflow (`develop`, `release/x.y.z`, `master`).

## Capturas y logos del README
- `docs/assets/` (banner SVG, logo, capturas). **Las capturas deben usar SIEMPRE datos ficticios**, nunca datos ni fotos reales del programa: `tools/readme-screenshots.cjs` intercepta el API y las imágenes con comercios inventados (build con `API_BASE_URL=https://mock-api.example`); después `python3 tools/readme-mobile-montage.py`.
- Al cambiar la UI de forma visible, regenera las capturas y actualiza el README (el del API enlaza a este repo y viceversa).

## Trampas conocidas
0. **2025 es intocable y siempre demo** (`DATA_MODE`). Los estilos de 2026 viven bajo `.ed26`; no mezclar con los de 2025. No usar `DatePipe` (sin locale data): usar `utils/format-date.ts`.
1. El mapa extrae lat/lng del parámetro `query=lat,lng` de `mapsUrl`; si el origen cambia el formato, desaparecen los marcadores (sin error visible).
2. El popup del mapa 2025 se construye en `utils/map-popup.ts` **escapando** todo (`utils/escape-html.ts`) y solo admite enlaces http(s); no vuelvas a interpolar datos del API directamente en HTML.
3a. Los textos de footer están en `landing.mini.*` y `ed26.footer.*` (ambos idiomas). Los iconos de navegación 2026 son SVG inline; no usar glifos Unicode.
3b. El mapa 2026 debe mantener su contexto de apilamiento propio (`:host { position: relative; z-index: 0 }`); sin él, los controles de Leaflet (z-index hasta 1000) se pintan sobre la cabecera y la barra inferior móvil. Las animaciones de 2026 respetan `prefers-reduced-motion`.
3. Leaflet y `leaflet.markercluster` (clústeres de la edición 2026) vienen de `unpkg.com` en `src/index.html` con SRI (necesita internet) y se usan como `any`. Si el plugin no carga, el mapa 2026 funciona sin clústeres.
4. La URL del API se resuelve en compilación: `API_BASE_URL` (env) o `--api-url=` → `define` → `resolveApiBaseUrl()`; si no hay, el valor por defecto de `src/environments/*.ts` (`https://castellon-comercio-notificator-api.onrender.com` en prod). Es **build-time**: cambiarla exige recompilar/redesplegar. Solo la inyecta el wrapper `tools/ng-live.cjs` en `build|serve|dev-server`.
5. `CommerceStatus.lastUpdate` es `string | null` (el API devuelve `null` si aún no hay scrapeos): las vistas deben tratarlo.
6. `ng` en `node_modules/.bin` es sobrescrito por el postinstall; si el flag `--live` "no existe", repetir `npm install`.
7. Las traducciones se cargan desde `/public/i18n/` (el `angular.json` publica `public/` bajo `/public`).
9. **Sin zoom de página**: el viewport (`maximum-scale=1, user-scalable=no`), `touch-action: pan-x pan-y` en `html/body` y `utils/disable-page-zoom.ts` (eventos `gesture*` de iOS) bloquean el zoom; solo los mapas (`.leaflet-container`) pueden hacer zoom. No quites `touch-action` de Leaflet ni mapas nuevos fuera de esa clase.
8. **Cookies/legal**: `ConsentService` es el único que puede cargar la analítica (`@vercel/analytics`); no la vuelvas a inyectar en `main.ts`. Si añades cualquier cookie, almacenamiento o recurso de terceros no técnico, requiere consentimiento: actualiza el banner y la tabla de `legal.storage.rows` (ambos JSON de i18n) y la página `/privacidad`.
