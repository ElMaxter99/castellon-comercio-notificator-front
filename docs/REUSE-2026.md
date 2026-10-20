# Reutilizar el proyecto en 2026

Para trabajar con Claude: "sigue `docs/REUSE-2026.md` del repo front". Haz antes el equivalente del API (`castellon-comercio-notificator-api/docs/REUSE-2026.md`), porque el front depende de sus datos.

> **Estado (v1.3.0)**: la edición 2026 ya tiene vistas renovadas (`/2026`) y 2025 queda congelada en demo (`/2025`). Ver [EDITIONS.md](EDITIONS.md). Los puntos 4 (aviso de fin de programa) y 5 (mock) de abajo ya no aplican a 2025; 2026 usa el API real. Quedan por hacer: apuntar `apiBaseUrl` al backend 2026 y revisar textos/mapa con datos reales.

## 1. Checklist
1. **API**: tener el backend 2026 desplegado y devolviendo datos. Anotar su URL.
2. **URL del API**: define la variable de entorno `API_BASE_URL` (p. ej. en Vercel) o usa `--api-url=`; no hace falta editar código (ver [ENVIRONMENTS-AND-MOCK.md](ENVIRONMENTS-AND-MOCK.md)). Solo si quieres cambiar el valor por defecto, edita `apiBaseUrl` en `src/environments/*.ts` (hoy `https://bcc-api.alvaromaxter.es`; dev `http://localhost:12001`).
3. **Textos de edición**: `grid.hero.highlight` ("Edición 2025") y otros; buscar "Abonem Castelló", "2025", "bonos" en `public/i18n/*.json`, `README.md`, `src/index.html` (título/metadatos sociales) y actualizar al nombre del programa 2026 en ambos idiomas.
4. **Aviso de fin de programa**: el modo mock se creó porque el programa 2025 terminó. Mientras el 2026 esté activo, desplegar con `isLive=true` (build `production` sin `--live=false`). Si el Vercel de 2025 tenía `--live=false` en su comando de build, **quitarlo**.
5. **Datos mock**: regenerar `public/mockup/*.json` con datos 2026 reales/representativos (copiar de `GET /api/comercios`).
6. **Mapa**: con datos 2026 comprobar que los `mapsUrl` siguen teniendo `query=lat,lng`. Si no, adaptar `extractCoordinates` en `commerce-map.component.ts` (o normalizar en el API).
7. **Versión**: subir `package.json` + `CHANGELOG.md`.
8. `npm install && npm start`, revisar a mano: carga, filtros, mapa, cambio de idioma, `/history`, estado en cabecera.
9. `npm audit`, y actualizar Angular si procede (`ng update`); la versión 20 sigue la rama LTS en 2026 pero conviene revisar.
10. Vercel: revisar variables (`NG_BUILD_CONFIG`), dominio y analytics.

## 2. Mejoras recomendadas (no implementadas)
1. **Escapar HTML** en `buildPopupContent` de la edición 2025 (XSS). La edición 2026 ya usa nodos DOM.
2. Mover `apiBaseUrl` a un único sitio (los 6 ficheros de entorno lo duplican).
3. Tipar `lastUpdate: string | null` y mostrar "sin datos" si es nulo.
6. Instalar Leaflet vía npm en lugar de CDN (offline, SRI, tipos `@types/leaflet`).
7. Agrupar marcadores (markercluster) si hay cientos de comercios.
8. Tests unitarios de `CommerceGridComponent` (filtros/paginación) y `CommerceService` (normalización https).
9. Mostrar en histórico los nombres añadidos/quitados con enlace al comercio, y aviso/push cuando haya altas (el API ya envía email).
10. Estado de error específico si el API devuelve lista vacía (programa sin datos aún) frente a fallo de red.
