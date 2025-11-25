# Guía de QA y pruebas

Esta guía recopila comprobaciones rápidas para validar el front de Castellón Comercio Notificator antes de publicar cambios. Todas las secciones están pensadas para ejecutarse en local, priorizando evidencias visuales y trazas claras para el equipo.

## Objetivos clave

- **Garantizar estabilidad** en los flujos principales (búsqueda, paginación, cambio de vista y mapa).
- **Detectar regresiones visuales** en layouts responsive y estados de carga/error.
- **Mantener accesibilidad mínima** (lectores de pantalla, tabulación y mensajes de estado).
- **Asegurar datos verosímiles** usando el modo _live_ o el _mock_ según el contexto.

## Preparación del entorno

1. Instala dependencias: `npm install` (Node 18+).
2. Elige origen de datos:
   - **Live (por defecto):** `npm start` o `npm run build -- --configuration=production`.
   - **Mock:** `npm start -- --live=false` para demos estables sin depender de la API.
3. Usa Chrome/Edge para validar compatibilidad y herramientas de dev.

## Batería rápida (10-15 minutos)

1. **Smoke UI:** arranca con `npm start` y verifica carga inicial sin errores en consola.
2. **Búsqueda:** filtra por texto y sector; confirma que el total y la paginación se actualizan.
3. **Mapa:** pulsa en un comercio y comprueba que el popup muestra nombre, sector y dirección.
4. **Vistas:** alterna listado/cuadrícula; valida truncado correcto y tooltips en nombres largos.
5. **Histórico:** abre `/history`, revisa fechas y totales; usa el botón de recarga.
6. **Accesibilidad básica:** navega con `Tab` hasta filtros y tarjetas; verifica foco visible y lectores ARIA en mensajes de estado.

## Suite automatizada

- **Unit tests:** `npm test` con Karma + Jasmine. Úsalos antes de commitear lógica o modelos.
- **Lint manual:** hasta que se añada linting automático, pasa Prettier en archivos tocados (config en `package.json`).

## Checklist de regresión visual

- **Responsive:** viewport 360px, 768px y 1280px; revisa colapsado del filtro y proporciones de tarjetas.
- **Carga/errores:** fuerza offline en devtools; comprueba banners de error y estados vacíos.
- **Mapa:** valida que los tiles de Leaflet cargan con HTTPS y que el zoom conserva marcadores visibles.
- **Histórico:** confirma que los contadores de altas/bajas coinciden con el listado.

## Evidencias y reporte

- **Capturas obligatorias:** home (lista y mapa), histórico y cualquier error reproducido.
- **Logs claros:** incluye consola y _network_ si hay fallos de API o CORS.
- **Formato de incidente:** contexto, pasos, resultado esperado/obtenido, capturas y versión del navegador.

## Próximos pasos sugeridos

- Añadir pruebas de accesibilidad automatizadas (pa11y/playwright) sobre rutas principales.
- Incorporar mediciones de performance (Lighthouse) en CI para detectar regresiones tempranas.
- Habilitar linting (`ng lint`) con reglas de accesibilidad y estilos consistentes.
