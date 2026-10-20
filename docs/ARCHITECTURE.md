# Arquitectura del front

## Objetivo
Dar una forma mejor de consumir el listado oficial de establecimientos adheridos al programa de bonos de Castelló de la Plana (2025): buscar, filtrar, verlos en un mapa, y saber cuándo se añaden/quitan comercios. Los datos los produce el API (`castellon-comercio-notificator-api`), que scrapea la web oficial.

## Stack
Angular 20.3 (builder `@angular/build:application`, esbuild), TypeScript 5.9 strict, RxJS 7.8, `@ngx-translate/core` 17, Leaflet 1.9.4 (CDN), `@vercel/analytics`, Karma/Jasmine.

## Árbol de componentes
```
App (app.ts)  ── layout
├─ aside .layout__disclaimer      (solo si !environment.isLive)
├─ header: marca + CommerceStatusComponent (+ LanguageSwitcher)
├─ <router-outlet>
│   ├─ ''         CommerceGridComponent
│   │    ├─ formulario de filtros (name, sector con dropdown buscable, address)
│   │    ├─ CommerceMapComponent  (recibe commerces filtrados + leyenda base)
│   │    └─ lista paginada de CommerceCardComponent (grid | list)
│   └─ 'history'  HistoryPageComponent → CommerceHistoryComponent
└─ ToastContainerComponent
```

## Datos
`CommerceService` (`providedIn: 'root'`):
- `getCommerces()` → `GET {apiBaseUrl}/api/comercios` (o `public/mockup/commerces.json`). Normaliza `img` y `mapsUrl`: `http://` → `https://`; nulos → `''`.
- `getStatus()` → `/api/comercios/status` (o `status.json`).
- `getHistory()` → `/api/comercios/history` (o `history.json`).
No usa `/filter` ni `/sectors` del API: el filtrado y la lista de sectores se calculan en cliente.

Modelos (espejo del API): `Commerce {name, sector, phone, address, img, mapsUrl}`, `CommerceStatus {environment, total, lastUpdate}`, `CommerceHistoryEntry {timestamp, added[], removed[], countAfter}`.

## CommerceGridComponent (el cerebro)
Estado en signals: `commerces`, `filterValue`, `currentPage`, `pageSize` (12/24/48), `viewMode` (grid/list), `isLoading`, `hasError`, dropdown de sector.
Pipeline derivado con `computed`:
`commerces → baseFilteredCommerces (name + address) → filteredCommerces (+ sector) → pagedCommerces`; `sectors` (únicos, ordenados por locale), `filteredSectors` (búsqueda en el dropdown), `totalPages`, `paginationItems` (con elipsis si >7 páginas).
- El formulario reactivo emite con `debounceTime(150)` hacia `filterValue`.
- Un `effect` resetea a página 1 al cambiar filtros y otro corrige página fuera de rango.
- Comparaciones `toLocaleLowerCase(locale)` con `includes` (no ignora acentos).
- El mapa recibe `baseFilteredCommerces` como leyenda (así la leyenda no desaparece al elegir un sector) y emite `sectorFilterChange` para filtrar el listado al pulsar un sector.
- Error de carga → `hasError` + toast traducido.

## CommerceMapComponent
- Usa `window.L` (Leaflet cargado en `index.html`); si no está, el mapa no se inicializa (silencioso).
- Tiles OpenStreetMap; centro por defecto `[39.986359, -0.037652]`, zoom 14 (Castelló).
- Un `circleMarker` por comercio; coordenadas desde `mapsUrl` → `URL.searchParams.get('query')` = `"lat,lng"`. Comercios sin coordenadas se omiten del mapa (pero siguen en el listado).
- Color por sector con paleta de 10 colores; leyenda con contador; click en leyenda filtra (toggle).
- Popup: enlace a `mapsUrl` (Google Maps) en pestaña nueva. HTML sin escapar (ver CLAUDE.md).
- Tras renderizar hace `fitBounds` a los marcadores.

## Estado y cabecera
`CommerceStatusComponent` pide `status`, muestra entorno, total, última actualización (`Intl.DateTimeFormat` con el locale activo), versión y autor leídos de `package.json`, y enlace a `/history` (configurable con `showHistoryLink`).
`CommerceHistoryComponent` muestra `displayLimit` entradas (por defecto 5; `0`/null = todas); la página `/history` muestra todas.

## i18n
- `LanguageService`: idiomas `es` (Castellano, `es-ES`) y `ca-ES-valencia` (Valencià). Orden de decisión: `localStorage['castellon-comercio-language']` → idioma del navegador → `es`. Actualiza `<html lang>`.
- `AssetTranslateLoader` carga `/public/i18n/<code>.json`.
- Secciones de las claves: `app, layout, navigation, language, toast, grid, map, card, history, status`.
- Para añadir un idioma: JSON nuevo + entrada en `supportedLanguages`.

## Estilos y accesibilidad
SCSS global `styles.scss` + SCSS por componente (BEM), presupuestos de componente 10/15 KB en producción. Roles/ARIA en estados de carga/error, toasts accesibles.

## Build y despliegue
Ver [ENVIRONMENTS-AND-MOCK.md](ENVIRONMENTS-AND-MOCK.md). Salida estática en `dist/`; despliegue de referencia en Vercel (comando de build parametrizable con `NG_BUILD_CONFIG` y `--live`).

## Tests
Solo `src/app/app.spec.ts` (plantilla de Angular). No hay cobertura real; ver mejoras en [REUSE-2026.md](REUSE-2026.md).
