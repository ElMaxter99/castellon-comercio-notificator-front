# Changelog

## v2.1.1 - 2026-10-20

### Cambiado
- Edición 2026, móvil: con la vista de mapa abierta, el mapa aparece antes que el panel de filtros.

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