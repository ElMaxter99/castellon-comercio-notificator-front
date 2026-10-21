# Ediciones: 2025 (demo) y 2026 (renovada)

La app tiene una pantalla de entrada (`/`) para elegir edición. Cada edición es un árbol de rutas independiente con su propio layout.

| Ruta | Qué es | Datos |
|---|---|---|
| `/` | Selector de edición (`pages/landing/`) | — |
| `/2025`, `/2025/history` | **Vistas originales**, idénticas a la v1.2.0 (`editions/edition-2025/` + componentes de siempre) | **Siempre demo** (`public/mockup/*.json`), con el aviso "programa finalizado" |
| `/2026`, `/2026/comercios`, `/2026/novedades` | **Vistas renovadas** (`editions/edition-2026/`) | API real según el entorno (ver abajo) |
| `/history` | Redirige a `/2025/history` (enlaces antiguos) | |

## Cómo se fuerza el modo demo en 2025
`services/data-mode.ts` define el token `DATA_MODE`. La ruta `2025` en `app.routes.ts` declara
`providers: [{ provide: DATA_MODE, useValue: 'demo' }, CommerceService]`, de modo que **todo el árbol 2025 recibe su propia instancia de `CommerceService`** que lee los mocks. Si no hay token (rutas 2026), `CommerceService` usa `environment.isLive`.
Consecuencia: el flag `--live=false` solo afecta a 2026 (útil para desarrollar sin API); 2025 nunca llama al API.

> No inyectes `CommerceService` desde un servicio raíz dentro de las vistas 2025: obtendrías la instancia raíz y perderías el modo demo.

## Edición 2025 — regla: no tocar
Debe mantenerse fiel a como estaba. Solo se han cambiado enlaces para vivir bajo `/2025` (`routerLink` de la marca, historial y "volver") y se añadió un enlace discreto "Cambiar de edición" en el pie. El layout antiguo de `App` vive ahora en `edition-2025.shell.*`; `App` solo contiene `<router-outlet>` y los toasts.

## Edición 2026 — diseño
**Objetivo**: útil, simple y mejorada respecto a 2025 (que era un explorador + panel de estado).

**Estilo**: paleta tomada del cartel promocional 2026 (crema `#FBFAF0` de fondo, verde bosque `#1E4D2B`/`#123524`, oliva `#8E9B3A`, salvia `#CBD8B0`, naranja `#F77F00`, azul `#1F4E9E`, melocotón `#F9CBA0`) y composición geométrica (`geo-art.component.ts`, SVG). Tokens CSS en `edition-2026.theme.scss` bajo la clase `.ed26` (importado desde `styles.scss`): `--forest`, `--orange`, `--cream`… más clases compartidas `ed26-btn`, `ed26-chip`, `ed26-card`, `ed26-state`. El naranja se usa como relleno con texto verde oscuro (contraste); para texto naranja se usa `--orange-deep`.

**Páginas**
- **Inicio** (`pages/home.*`): buscador grande que lleva al directorio, 5 cifras (comercios, sectores, nuevos y bajas de los últimos 7 días, última actualización), sectores principales, últimas novedades y acceso al mapa.
- **Comercios** (`pages/shops.*`), con el patrón de listado de [bonocomerciovlc.com](https://bonocomerciovlc.com/comercios-adheridos/) adaptado a nuestra identidad:
  - Barra superior con el **contador** de establecimientos (se actualiza con los filtros) y selector **Lista / Mapa**.
  - **Panel lateral de filtros** (arriba en móvil; con la vista de mapa abierta, en móvil el mapa va antes y los filtros debajo): nombre o dirección (**sin acentos**), sector (desplegable con contadores), solo favoritos y *Limpiar filtros*. Filtra en vivo, sin botón "aplicar".
  - **Lista agrupada por sector** en acordeones (icono de color, nombre, contador). Sin filtros solo se abre el primer grupo; con filtros se abren todos; *Desplegar/Plegar todo*. Los grupos cerrados no se renderizan.
  - **Tarjetas** con imagen del comercio (con respaldo si falla), dirección, teléfono (`tel:`), *cómo llegar* y favorito (★, en `localStorage`).
  - **Mapa** Leaflet con **clústeres numerados** (`leaflet.markercluster` desde unpkg en `index.html`). Encuadra la zona donde está la mayoría de comercios: los de coordenadas erróneas (mal geocodificados en la web oficial) siguen en el mapa pero no alejan el zoom.
  - **Los filtros viven en la URL** (`?q=&sector=&view=map&fav=1`): enlaces compartibles y botón atrás coherente.
- **Novedades** (`pages/news.*`): línea de tiempo de altas/bajas agrupada por mes.
- **Móvil**: la navegación pasa a barra inferior.

**Piezas**
- `edition-2026.store.ts`: `Edition2026Store` (provisto a nivel de ruta) carga comercios, estado e histórico **una sola vez** para todas las páginas; calcula sectores, color estable por sector, novedades recientes y favoritos.
- `components/shops-map.component.ts`: mapa Leaflet con clústeres y popup construido con nodos DOM (sin HTML interpolado → sin el riesgo XSS del mapa de 2025).
- `sector-icon.ts`: emoji decorativo por sector (coincidencia por palabra clave; `🏪` por defecto).
- `utils/commerce-utils.ts` (`normalizeText`, `commerceKey`, `coordsFromMapsUrl`) y `utils/format-date.ts` (Intl; **no usar `DatePipe`** con locales `es-ES`/`ca`: no hay datos de locale registrados y renderiza vacío).
- i18n: claves `landing.*` y `ed26.*` en ambos JSON.

## Footers e iconos
- **`/` (selector)**: minifooter con lo justo: aviso de proyecto independiente, enlace a la web oficial (fuente de los datos), código en GitHub y versión (`landing.mini.*`).
- **Edición 2026** (`edition-2026.shell.*`): footer con tres bloques — marca y descripción de una línea; *Datos* (enlace a la web oficial y fecha de la última actualización, tomada de `/api/comercios/status`); *Más* (cambiar de edición, edición 2025 demo, código) — y una línea legal con el aviso y la versión. El margen inferior extra solo existe en móvil (barra de navegación fija).
- **Iconos de navegación**: SVG inline con trazo `currentColor` (casa, tienda, campana) en lugar de glifos de texto; en móvil se muestran más grandes sobre la etiqueta.

## Animaciones y movimiento
Definidas en `edition-2026.theme.scss` (keyframes globales `ed26-fade-up|pop|float|shimmer` y utilidad `.ed26-reveal` con `style="--i: N"` para escalonar):
- Cada página entra con un fundido; grupos y tarjetas aparecen escalonados; el contenido de un acordeón se anima al abrirse.
- Contador de establecimientos con "pop" cuando cambia; favoritos con "pop" al marcarse; hover elevado en tarjetas y estadísticas.
- Arte geométrico flotante en Inicio y en el selector de edición.
- Esqueletos de carga con brillo (`.ed26-skeleton`) en lugar de texto.
- **Scroll animado**: al cambiar de Lista a Mapa (y al llegar con `?view=map`, p. ej. desde "Abrir el mapa") la página se desliza hasta los resultados dejando sitio a la cabecera (`scroll-margin-top` en `#shops-results`).
- Todo se desactiva con `prefers-reduced-motion: reduce` (animaciones y transiciones; el scroll pasa a instantáneo).

## Apilamiento (z-index) y móvil
Los paneles de Leaflet usan `z-index` 400–1000. `ShopsMapComponent` crea su propio contexto de apilamiento (`position: relative; z-index: 0` en `:host`) para que el mapa nunca quede por encima de la cabecera fija (20) ni de la barra inferior móvil (30). Si añades otro widget con z-index alto, aíslalo igual.

## Favicon
`public/favicon.svg` (composición geométrica del cartel 2026: verde bosque, oliva, naranja y azul) más `favicon-32.png`, `favicon-192.png`, `favicon.ico` (16/32/48) y `apple-touch-icon.png` (180, sin esquinas redondeadas). Se declaran en `src/index.html`, junto con `theme-color` `#1E4D2B`. Es un icono propio inspirado en el cartel, no el logotipo oficial del programa: para sustituirlo, regenera esos ficheros desde el SVG nuevo.

## Estados vacíos
Si el API aún no tiene comercios 2026 (programa sin publicar), 2026 muestra "Todavía no hay comercios publicados" en vez de un error.

## Pendiente / ideas
- No se ha incorporado ningún asset del cartel (ilustración, logo del programa): solo su paleta.
- Tests de `Edition2026Store` y `ShopsPageComponent`.
