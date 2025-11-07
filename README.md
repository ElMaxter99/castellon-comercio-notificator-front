# Castellón Comercio Notificator Front

Aplicación web desarrollada con Angular para consultar, filtrar y visualizar sobre un mapa los comercios adheridos al programa municipal "Abonem Castelló". El proyecto ofrece una experiencia accesible y responsive que centraliza la información pública del programa y añade utilidades de búsqueda avanzadas.

> **Aviso**
> Esta iniciativa es independiente y sin ánimo de lucro. No guarda relación con el Ayuntamiento de Castelló de la Plana ni con CONFECOMERÇ. Los datos mostrados proceden de la web oficial del programa y se ofrecen únicamente con fines informativos.

## Características principales

- **Explorador de comercios** con filtros combinables por nombre, sector y dirección.
- **Visualización geográfica** mediante Leaflet para ubicar los establecimientos sobre un mapa interactivo.
- **Cambio rápido de vista** entre cuadrícula y listado para adaptar la navegación a cada necesidad.
- **Control de paginación** configurable (12/24/48 elementos) con indicadores claros del total de resultados.
- **Panel de estado** que muestra entorno de ejecución, número total de comercios y fecha de la última actualización.
- **Histórico de cambios** detallado que resume altas y bajas del censo de comercios.
- **Indicadores de carga y error** accesibles en todas las secciones para mejorar la experiencia de usuario.
- **Interfaz responsive** optimizada para dispositivos móviles, tabletas y escritorio.

## Arquitectura

- **Framework**: Angular 20 con componentes standalone, señales (`signal`) y detección de cambios `OnPush` para maximizar el rendimiento.
- **Capas**:
  - `services/`: clientes HTTP reutilizables que encapsulan las peticiones a la API (`CommerceService`).
  - `components/`: piezas visuales reutilizables (`commerce-grid`, `commerce-card`, `commerce-map`, `commerce-status`, `commerce-history`).
  - `pages/`: páginas ensambladas mediante rutas perezosas (por ejemplo, `history`).
  - `models/`: tipado TypeScript compartido (`Commerce`, `CommerceStatus`, `CommerceHistoryEntry`).
- **Datos**: consumo de la API pública, con normalización de URLs y uso de Leaflet cargado desde CDN.
- **Estilos**: SCSS modular con patrones BEM y adaptaciones responsive.

## Requisitos previos

- Node.js 18 o superior.
- Angular CLI 20 (se instala localmente con las dependencias).

Instala las dependencias del proyecto con:

```bash
npm install
```

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia el servidor de desarrollo en `http://localhost:4200/` con recarga en caliente. |
| `npm run build` | Genera el artefacto de producción optimizado en `dist/`. |
| `npm test` | Ejecuta la suite de pruebas unitarias mediante Karma + Jasmine. |
| `npm run watch` | Compila en modo desarrollo y permanece atento a cambios de archivos. |

## Configuración y entorno

- **Base de datos remota**: no se requiere backend propio; los datos se consumen desde la API pública.
- **Variables de entorno**: no son necesarias para la ejecución local. El endpoint se encuentra configurado en `CommerceService`.
- **Mapas**: Leaflet se carga desde CDN (definido en `src/index.html`). Es necesario disponer de conexión a internet para visualizar los mapas.

## Modo mock (datos ficticios)

Para facilitar las demostraciones una vez finalizado el programa «Abonem Castelló», la aplicación incorpora un modo *mock* que simula las respuestas de la API con fixtures almacenados en `public/mockup/`. Cuando este modo está activo, se muestra un aviso persistente indicando que los datos son meramente ilustrativos.

### ¿Cuándo usarlo?

- **Periodo oficial finalizado**: permite seguir enseñando la interfaz sin depender de la API real.
- **Entornos de pruebas o ferias**: garantiza datos estables y controlados que no caducan.

### Cómo activarlo

Todas las órdenes de `npm` delegan en el envoltorio `tools/ng-live.cjs`, que acepta el flag `--live`. Por defecto la aplicación se ejecuta en modo real (`--live=true`). Para forzar el modo mock indica `--live=false` tras un doble guion (`--`):

```bash
# Servidor de desarrollo con datos mock
npm start -- --live=false

# Build de producción simulada
npm run build -- --configuration=production --live=false
```

> Si necesitas el comportamiento original, omite el flag o establece `--live=true`.

Tras `npm install` el script de *postinstall* sustituye el binario local de Angular CLI por dicho envoltorio, de modo que **los comandos directos** (`ng build`, `ng serve`, etc.) también aceptan el flag `--live`. Esto permite reutilizar el mismo parámetro en pipelines o despliegues como `ng build --configuration=$NG_BUILD_CONFIG --live=false` sin errores.

## Estructura de rutas

| Ruta | Descripción |
| --- | --- |
| `/` | Explorador principal de comercios con filtros, mapa y listado paginado. |
| `/history` | Página con el historial completo de cambios registrados en la API. |
| `**` | Cualquier otra ruta redirige al explorador principal. |

## Buenas prácticas implementadas

- Uso de `takeUntilDestroyed()` para evitar fugas de memoria en suscripciones.
- Normalización de URLs inseguras (HTTP → HTTPS) antes de mostrarlas en la interfaz.
- Componentes accesibles con roles ARIA, mensajes de estado y navegación por teclado.
- Separación clara entre lógica de presentación y consumo de datos.
- Internacionalización básica con `Intl.DateTimeFormat` para mostrar fechas en español.

## Desarrollo y contribución

1. Realiza un fork del repositorio y crea una rama para tu cambio.
2. Instala dependencias (`npm install`).
3. Ejecuta `npm start` (o directamente `ng serve`) y desarrolla en local.
4. Asegúrate de que `npm test` se ejecuta sin errores antes de enviar la contribución.
5. Abre una pull request describiendo claramente el cambio propuesto.

Las sugerencias y mejoras son bienvenidas para seguir evolucionando la experiencia de los comercios adheridos.

## Licencia

Este proyecto se distribuye bajo los términos establecidos por sus autores. Revisa el repositorio original para más información sobre la licencia aplicable.
