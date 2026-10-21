# Changelog

## v2.5.2 - 2026-10-21

### Tests
- 23 tests nuevos (51 en total) para la edición 2026: `Edition2026Store` (sectores, colores estables, favoritos persistentes, altas recientes), `ShopsPageComponent` (agrupación, filtros por URL, chips de sector, favoritos, panel móvil) y `NewsPageComponent` (meses plegables, recorte a 8 nombres, «Desplegar todo»).

## v2.5.1 - 2026-10-20

### Corregido
- **Filtros de Comercios en móvil**: los nombres de sector largos (p. ej. «Librería, papelería y material de oficina») ensanchaban la rejilla y el panel se salía de la pantalla. La columna usa `minmax(0, 1fr)` y los chips se parten en varias líneas. A 320 px la cabecera de la 2026 tampoco desborda (se oculta el año).

### Cambio
- **Sin zoom en la app, solo en los mapas**: `viewport` con `maximum-scale=1, user-scalable=no`, `touch-action: pan-x pan-y` en `html/body` y cancelación de los eventos `gesture*` de iOS (`utils/disable-page-zoom.ts`) salvo dentro de `.leaflet-container`, donde zoomea Leaflet. Nota: bloquear el zoom limita la accesibilidad (WCAG 1.4.4).

## v2.5.0 - 2026-10-20

### Legal (LSSI / RGPD)
- **Aviso de cookies** (`CookieBannerComponent`): «Aceptar» y «Rechazar» con el mismo peso visual. La analítica de Vercel **ya no se carga al arrancar**: `ConsentService` la inyecta solo tras aceptar (y recarga si se retira el consentimiento). La decisión se guarda en `castellon-comercio-consent-v1`.
- **Página `/privacidad`** (castellano y valencià): responsable, datos que se tratan, tabla de cookies y almacenamiento local, servicios de terceros (Vercel, Render, unpkg, OpenStreetMap, Google Maps), derechos RGPD y reclamación ante la AEPD. Enlazada desde el pie de la portada y de la edición 2026, junto a «Gestionar cookies» para cambiar la elección.
- Tests de `ConsentService` (27 en total).

### Cambio (edición 2026)
- **Comercios en móvil**: se elimina la tira horizontal de sectores y el selector suelto. Los filtros son un único botón plegable «Filtros de búsqueda» (con contador de filtros activos) que al abrirse muestra búsqueda, sectores en chips que se reparten en varias líneas y favoritos. En escritorio se mantiene la fila de chips y el panel lateral.
- **Comercios**: nueva cabecera con la composición geométrica del cartel, chips de sector (filtro rápido con recuento y scroll horizontal), tarjetas con franja del color del sector y botones de llamar / cómo llegar.
- **Novedades**: el cronograma es plegable. Cada mes es una fila resumen (+altas / −bajas y nº de actualizaciones), solo se despliega el más reciente y su última entrada, y cada bloque muestra los 8 primeros nombres con «Ver N más». Botón «Desplegar/Plegar todo». Pensado para listados largos (p. ej. 200 altas de golpe).

## v2.4.3 - 2026-10-20

### Cambio
- `jasmine-core` 5.9 → 5.13 y `karma-jasmine-html-reporter` 2.1 → 2.3 (sustituye a los PRs de Dependabot #49 y #50). Tests 22/22 y build de producción correctos.
- `jasmine-core` 7 sigue ignorado: aunque el reporter 2.3 ya lo admite, el parche de `zone.js` 0.15 para Jasmine falla (`Cannot assign to read only property 'describe'`) y no arrancan los tests.

## v2.4.2 - 2026-10-20

### Cambio
- La URL del API por defecto (sin `API_BASE_URL`/`--api-url`) pasa de `https://bcc-api.alvaromaxter.es` (API antigua, respondía 526) a `https://castellon-comercio-notificator-api.onrender.com`. Docs actualizadas.

## v2.4.1 - 2026-10-20

### Cambio
- `@vercel/analytics` 1.5 → 2.0.1: mismo comportamiento verificado en navegador (misma petición `/_vercel/insights/script.js`, mismo `<script>` inyectado, sin errores).
- GitHub Actions: `actions/checkout` y `actions/setup-node` a la v7.

### Añadido
- `docs/DEPENDENCIES.md`: política de dependencias, subidas ignoradas a propósito y método para revisar PRs de Dependabot.
- Dependabot ignora las subidas mayores que requieren migración manual: Angular (y TypeScript/zone.js, que dicta Angular), `@ngx-translate/core` 18 (elimina `TranslateModule`) y `jasmine-core`/`@types/jasmine` 7 (incompatibles con `karma-jasmine-html-reporter`).

## v2.4.0 - 2026-10-20

### Añadido
- **CI** con GitHub Actions (`.github/workflows/ci.yml`): tests y builds de producción (API real y modo mock) en cada PR y push a `develop`/`master`. Dependabot semanal (npm, agrupando Angular) y mensual (Actions).
- 22 tests unitarios: utils (búsqueda sin acentos, coordenadas, escapado, popup, fechas), `CommerceService` (modo demo/live y normalización https) y `api-url`.

### Corrección
- **Seguridad**: el popup del mapa de la edición 2025 interpolaba datos del API sin escapar (riesgo de XSS). Ahora se construye en `utils/map-popup.ts` escapando todo y admitiendo solo enlaces http(s). El marcado y el aspecto no cambian.
- `CommerceStatus.lastUpdate` se tipa `string | null`; la vista de estado de 2025 oculta la línea de última actualización si el API aún no tiene scrapeos (antes mostraba una fecha incorrecta).

## v2.3.0 - 2026-10-20

### Añadido
- Minifooter en el selector de edición (`/`): aviso de proyecto independiente, fuente de los datos, código y versión.
- Footer en la edición 2026: marca, enlace a la web oficial con fecha de última actualización, accesos (cambiar de edición, edición 2025, código) y aviso legal con versión.

### Cambiado
- Iconos de navegación de la edición 2026 (Inicio, Comercios, Novedades): SVG propios en lugar de glifos de texto.

## v2.2.0 - 2026-10-20

### Añadido
- Edición 2026: animaciones (entrada de páginas, grupos y tarjetas escalonados, contador y favoritos con "pop", hover, arte flotante, esqueletos de carga), desactivadas con `prefers-reduced-motion`.
- Scroll animado hasta el mapa al cambiar a la vista Mapa y al llegar con `?view=map`.
- Favicon nuevo de la edición 2026 (SVG, PNG, ICO y apple-touch-icon) y `theme-color` verde bosque.

### Cambiado
- Móvil: con la vista de mapa abierta, el mapa aparece antes que el panel de filtros.

### Corrección
- El mapa de la edición 2026 ya no se pinta por encima de la cabecera fija ni de la barra de navegación inferior al hacer scroll (contexto de apilamiento propio).

## v2.1.0 - 2026-10-20

### Cambiado
- Edición 2026, página de comercios rediseñada (patrón de listado tipo bonocomerciovlc.com): contador de establecimientos con selector Lista/Mapa, panel lateral de filtros, lista agrupada por sector en acordeones con tarjetas con imagen, y mapa con clústeres numerados (`leaflet.markercluster`).
- El mapa 2026 encuadra la zona principal e ignora, para el zoom inicial, los comercios con coordenadas erróneas.
- Se eliminan las claves i18n `ed26.shops.resultsOne|resultsMany|sectorsLabel|loadMore` y se añaden las de los nuevos filtros (es / ca-ES-valencia).

## v2.0.0 - 2026-10-20

Nueva versión mayor por el cambio de edición: la edición 2026 pasa a ser la versión principal y la 2025 queda como demo.

### Añadido
- URL del API configurable sin tocar código: variable de entorno `API_BASE_URL` o flag `--api-url=...` en `npm start|build` y `ng ...` (se inyecta en compilación con `define`). Sin configurar se usan los valores por defecto de cada entorno.

### Corrección
- Documentación al día tras el cambio de ediciones (`docs/ARCHITECTURE.md`, `docs/REUSE-2026.md`).

### Cambiado
- Los ficheros `src/environments/*.ts` obtienen `apiBaseUrl` con `resolveApiBaseUrl(<valor por defecto>)` (`src/environments/api-url.ts`).
- **Ruptura**: la raíz `/` es ahora el selector de edición; las vistas originales viven en `/2025` (siempre en modo demo) y las renovadas en `/2026` (introducido en 1.3.0, consolidado como versión mayor).

## v1.3.0 - 2026-10-20

### Añadido
- Selector de edición en la entrada (`/`).
- Edición 2026 (`/2026`): inicio con buscador y cifras, directorio de comercios (búsqueda sin acentos, sectores, lista/mapa, favoritos, filtros en la URL) y línea de tiempo de novedades. Estilo basado en la paleta del cartel 2026 y navegación inferior en móvil.
- Documentación `docs/EDITIONS.md`.

### Cambiado
- La edición 2025 pasa a `/2025` y funciona siempre en modo demo (`DATA_MODE`), con las vistas originales.
- `/history` redirige a `/2025/history`.

## [v1.2.0](https://github.com/ElMaxter99/castellon-comercio-notificator-front/releases/tag/v1.2.0) - 2025-11-07

### Añadido
- Make map popups open Google Maps #20
- Add mock mode toggle with disclaimer and sample data #19
- Add brand branding to layout #18
- Change icon and socialmetadata #17

## [v1.1.1](https://github.com/ElMaxter99/castellon-comercio-notificator-front/releases/tag/v1.1.1) - 2025-11-06

### Añadido
- Add reusable loading spinner for API call states #15hours ago
- Configure environment-specific API endpoints #13
- Add brand navigation button and auto-scroll on history view 

### Correciones 
- Fix list view layout for commerce grid #14

## [v1.1.0](https://github.com/ElMaxter99/castellon-comercio-notificator-front/releases/tag/v1.1.0) - 2025-11-04

### Añadido

- Feat: add Valencian language support #9
- Add vercel analytics #10
- Fix responsive movil #11

## [v1.0.0](https://github.com/ElMaxter99/castellon-comercio-notificator-front/releases/tag/v1.0.0) - 2025-11-03

### Añadido

- Explorador principal con filtros por nombre, sector y dirección para los comercios adheridos.
- Componente de tarjeta reutilizable con vista en cuadrícula o lista y manejo de imágenes de respaldo.
- Integración de Leaflet para mostrar un mapa interactivo con leyenda filtrable por sectores.
- Sistema de paginación configurable (12, 24 y 48 elementos) con control de estado (`signal`).
- Panel de estado global que consulta el total de comercios, el entorno y la fecha de actualización.
- Historial completo de altas y bajas con resumen y contadores de movimientos.
- Gestión centralizada de estados de carga y error en servicios y componentes visuales.
- Normalización automática de URLs (HTTP → HTTPS) antes de mostrarlas en la interfaz.
- Estilos responsive y accesibles con soporte para mensajes ARIA en estados críticos.