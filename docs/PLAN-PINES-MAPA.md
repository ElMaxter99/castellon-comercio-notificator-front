# Plan: mejorar los pines del mapa (edición 2026)

Estado: **implementado en 4 PRs apilados** (21-oct-2026): fase 1 → v2.8.0, fase 2 → v2.9.0, fase 3 → v2.10.0, fase 4 → v2.11.0. Decisiones tomadas por defecto: emoji como icono, popup clásico en móvil, sin «Mi ubicación» y leyenda dentro del mapa. Alcance: solo `/2026/comercios?view=map` (`shops-map.component.ts`). El mapa de la 2025 es intocable.

## 1. Cómo es hoy

| Aspecto | Hoy |
|---|---|
| Pin | `L.circleMarker` de 8 px, color del sector y borde crema |
| Color por sector | Hash del nombre sobre **8 colores**; con 12 sectores (y más a futuro) hay **colisiones** y varios sectores se ven igual |
| Identificación | Solo el color: sin icono, sin forma → ilegible para daltónicos |
| Estados | No hay hover, seleccionado ni favorito (el mapa no sabe qué comercios están guardados) |
| Clústeres | Círculo verde con el recuento; ignora de qué sectores son |
| Popup | Nombre, sector, dirección y «Cómo llegar»; sin teléfono ni favorito |
| Lista ↔ mapa | Desconectados: pulsar un pin no resalta su tarjeta, ni al revés |
| Teclado / lector | Los `circleMarker` (SVG) no reciben foco ni tienen `aria-label` |
| Táctil | 16 px de diámetro: por debajo de los 44 px recomendados |
| Leyenda | No hay (el único filtro por sector está fuera del mapa) |

Trampas que condicionan el diseño (`CLAUDE.md`): las coordenadas salen del `mapsUrl` (trampa 1), el mapa debe conservar su contexto de apilamiento (3b), Leaflet y `markercluster` vienen de CDN y son opcionales (3), el zoom de página está bloqueado y solo `.leaflet-container` puede hacer zoom (9), y cualquier recurso de terceros o geolocalización exige actualizar `/privacidad` (8).

## 2. Objetivo

Que un pin diga **qué es** (sector) y **en qué estado está** (normal / favorito / seleccionado) de un vistazo, se pueda tocar sin fallar en el móvil, se pueda usar con teclado y esté conectado con la lista.

## 3. Fases (cada una, un PR pequeño)

### Fase 1 — Pin nuevo y paleta (PR 1)
1. Sustituir `circleMarker` por `L.divIcon` con forma de **gota/píldora**: fondo del color del sector, borde crema, sombra suave y el **icono del sector** dentro (`sectorIcon()` ya existe; emoji de entrada, SVG propio si se quiere más control).
2. **Paleta sin colisiones**: asignar color por *posición en el ranking de sectores* (el store ya los ordena por número de comercios) sobre una paleta ampliada a 12–14 tonos con buen contraste, en lugar del hash. El mismo color debe usarse en chips, tarjetas y mapa (`store.sectorColor`).
3. Área táctil ≥ 40 px (hueco transparente alrededor del dibujo) y tamaño que crece un poco con el zoom.
4. **Favoritos**: pasar `favorites` al mapa y dibujar una estrella naranja sobre el pin.
5. El HTML del icono se construye solo con valores controlados (icono, color); **nunca** con datos del API (misma regla que el popup 2025).

Criterio de aceptación: 12 sectores distinguibles por color *y* por icono; en una captura en escala de grises siguen distinguiéndose.

### Fase 2 — Selección, popup y conexión con la lista (PR 2)
1. Estado **seleccionado**: pin más grande, anillo naranja y pequeño rebote (respeta `prefers-reduced-motion`).
2. Popup rediseñado como tarjeta: nombre, chip del sector, dirección, botones **Llamar**, **Cómo llegar** y **favorito**. En móvil, hoja inferior compacta en vez de popup flotante que tapa el pin.
3. **Lista ↔ mapa**: botón «Ver en el mapa» en cada tarjeta (vuela al pin y lo selecciona) y, al pulsar un pin, llevar la lista a su tarjeta. Estado en la URL (`?shop=<clave>`) para poder compartirlo.
4. **Teclado y accesibilidad**: `keyboard: true`, `role="button"` y `aria-label` («Comercio X, sector Y»), foco visible, Enter abre el popup, Esc lo cierra.

### Fase 3 — Clústeres con información (PR 3)
1. Tamaño proporcional al recuento (3 tallas) y **anillo segmentado** con la composición por sectores (conic-gradient del CSS, sin librerías).
2. `spiderfyOnMaxZoom` y zoom al pulsar, con animación suave.
3. Probar el límite de rendimiento (76 comercios hoy; simular 1 000). Si hiciera falta: `preferCanvas` o clústeres sin animación en móvil.

### Fase 4 — Leyenda y filtros sobre el mapa (PR 4, opcional)
1. Leyenda plegable con los sectores (los mismos chips), que filtra al pulsar.
2. Interruptor «solo favoritos».
3. **Mi ubicación** *(solo si se decide)*: añade geolocalización → hay que **pedir permiso, no guardar nada y actualizar `/privacidad`** en ambos idiomas antes de lanzarlo.

## 4. Transversal

- **Tests (Karma)**: asignación de color por ranking (sin colisiones hasta N sectores, estable al filtrar), fábrica del icono (escapa/limita el contenido), composición del clúster, selección y `?shop=`. Los tests de DOM de Leaflet usan el global `L` simulado o el real cargado en el test.
- **QA en navegador**: escritorio y móvil (320/390/1280), tema actual, `prefers-reduced-motion`, **pellizco real en un móvil** (el zoom de página está bloqueado y el mapa debe seguir haciéndolo), contraste de los pines sobre el mapa base.
- **Documentación**: `docs/ARCHITECTURE.md` (mapa), `docs/EDITIONS.md`, `CLAUDE.md` (nueva trampa si aparece) y capturas del README con datos ficticios.
- **Teselas**: seguimos con OpenStreetMap (atribución visible). Si el tráfico crece, revisar su política de uso y valorar un proveedor con clave; sería otro recurso de terceros → `/privacidad`.

## 5. Riesgos

| Riesgo | Mitigación |
|---|---|
| XSS si el icono lleva texto del API | Icono y color vienen de tablas internas; el texto del comercio solo con `textContent` |
| Coordenadas erróneas del origen | Se mantiene `mainArea()` (mediana) para el encuadre |
| `markercluster` no carga (CDN) | Ya es opcional: sin él, pines sueltos; probar ese camino |
| SCSS/estilos de Leaflet fuera del encapsulado | Clases bajo `.ed26` en el tema (como `.ed26-cluster`) |
| Pin demasiado grande en zonas densas | Tamaño por zoom + clústeres + `spiderfy` |

## 6. Decisiones que necesito de ti

1. **Icono del pin**: ¿emoji (rápido, coherente con los chips) o juego de iconos SVG propio (más pulido, más trabajo)?
2. **Popup en móvil**: ¿hoja inferior o popup clásico?
3. **Mi ubicación**: ¿sí o no? (implica permiso y cambio de privacidad)
4. **Leyenda**: ¿dentro del mapa o reutilizando los chips de arriba?

## 7. Orden recomendado y esfuerzo orientativo

PR 1 (pin + paleta, ½–1 día) → PR 2 (selección/popup/lista, 1–1,5 días) → PR 3 (clústeres, ½–1 día) → PR 4 (leyenda/ubicación, ½–1 día, opcional). Cada PR sube su versión y su CHANGELOG, con capturas con datos ficticios.
