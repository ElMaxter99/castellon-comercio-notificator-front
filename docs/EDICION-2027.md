# Guía front para la edición 2027

> **Cómo usarla con Claude:** *«Sigue `docs/EDICION-2027.md` del repo front»*, **después** de hacer la parte del API ([`docs/EDICION-2027.md` del API](https://github.com/ElMaxter99/castellon-comercio-notificator-api/blob/develop/docs/EDICION-2027.md), que es el punto de partida y trae el estado general, las señales de que empezó 2027 y la copia de seguridad de datos). Este documento cubre solo el front. [`REUSE-2026.md`](REUSE-2026.md) queda como checklist general e histórico de mejoras.

---

## 1. Dónde lo dejamos (nov-2026)
- **v2.14.0** en `master`. La edición 2026 (`/2026`) es la vigente; `/2025` es una demo congelada (siempre datos de `public/mockup/`, **intocable**).
- El API está en **modo mock**: la edición 2026 muestra el aviso naranja «Datos de demostración…» (`CommerceStatus.mode === 'mock'`, texto `ed26.demo.banner`). No hace falta recompilar para entrar o salir de ese estado: lo decide el API.
- Con `npm start -- --live=false` o `--live=false` en el build, el front no llama al API y usa `public/mockup/*.json` (su `status.json` lleva `mode: "mock"`, así que también muestra el aviso).
- Despliegue: Vercel (la URL del API se fija al compilar con `API_BASE_URL`, ver [`ENVIRONMENTS-AND-MOCK.md`](ENVIRONMENTS-AND-MOCK.md)). Dominio público: bono-castellon.alvaromaxter.es.

## 2. Orden de trabajo
1. **API primero** (su guía, §3): scraper verificado, namespace nuevo, `MOCK_MODE` fuera, `mode: "live"`. Al pasar a `live`, el aviso de demo **desaparece solo**.
2. **Decidir qué pasa con `/2026`** (§3) y crear la edición nueva (§4).
3. Textos, legal, capturas y despliegue (§5–§7).

## 3. Decisión: ¿qué hacemos con `/2026`?
El API de 2027 usará otro namespace de Redis, así que **`/2026` dejará de ver los datos de 2026** si sigue leyendo del API. Opciones:

| Opción | Cómo | Cuándo conviene |
|---|---|---|
| **A. Archivo estático** (recomendada) | Guardar los datos 2026 en `public/archivo/2026/*.json` (copia de seguridad del API, §1 de su guía) y servirlos con `DATA_MODE`-like: `/2026` pasa a leer del archivo, con un banner «Edición anterior». | Quieres conservar la web del año pasado navegable. |
| **B. Redirigir** | `/2026` → `/2027` (o a la portada). | No te importa conservar la anterior. |
| **C. Dejarla en demo** | `/2026` siempre con `public/mockup/`, como la 2025. | Prefieres no mantener datos reales. |

⚠️ **No subas datos reales de comercios al repo sin pensarlo**: son públicos en la web oficial, pero las capturas, mocks y tests del repo han sido siempre ficticios. Si eliges A, hazlo conscientemente (y menciónalo en `/privacidad` y el README).

## 4. Crear la edición 2027
1. `git checkout develop && git pull` → rama `feature/edicion-2027`. `npm ci` (o `npm install` con npm ≥ 11 si no hay lock) y `npm test` en verde.
2. Copiar `src/app/editions/edition-2026/` → `edition-2027/` y renombrar (`Edition2027Store`, `edition2027Routes`, selectores `app-ed27-*`, clase de tema `.ed27` o reutilizar `.ed26` si el diseño no cambia). Mantener los estilos bajo la clase de la edición (trampa 0: no mezclar con los de otras).
3. `app.routes.ts`: añadir `2027` (lazy `edition2027Routes`) con `data: { titleKey }` en cada ruta (claves `title.*`, trampa 3d). Decidir la entrada desde la portada (`pages/landing/`).
4. i18n: duplicar `ed26.*` → `ed27.*` en **ambos** JSON (`es.json`, `ca-ES-valencia.json`) y revisar los textos con «2026», «Abonem Castelló», «bonos»: `grep -rniE "2026|abonem" src public README.md docs`.
5. Retirar el aviso de demo de la edición nueva (o dejarlo condicionado a `mode === 'mock'`, que es lo que hace ahora).
6. Revisar `src/index.html`: título, descripción, Open Graph/Twitter (son **estáticos**) y `public/og-image.png` (1200×630, sin datos reales; regenerar si cambia el diseño).
7. Mapa: comprobar con datos reales que `mapsUrl` sigue trayendo `query=lat,lng` (trampa 1). Los comercios sin coordenadas se muestran en la lista y los enlaces compartidos los llevan a su ficha.
8. Leaflet + `leaflet.markercluster` vienen de unpkg con SRI (`utils/load-leaflet.ts`): si cambias de versión, actualiza URLs y SRI y la política de privacidad.

## 5. Legal y privacidad
- `/privacidad` (fecha de actualización, tabla `legal.storage.rows`): revisar que lo que se guarda sigue siendo cierto (idioma, favoritos `castellon-comercio-favorites-<año>`, consentimiento). Si cambias claves de `localStorage` (p. ej. favoritos 2027), refleja la nueva clave y decide qué pasa con los favoritos de 2026.
- Analítica (`@vercel/analytics`): solo con consentimiento, a través de `ConsentService` (trampa 8).
- Si añades **cualquier** cookie, almacenamiento o recurso de terceros no técnico: actualizar banner, tabla y página de privacidad.

## 6. Dependencias y calidad
- **Angular**: está en 22; `ng update` de mayor en mayor (23…), junto con TypeScript y zone.js ([`DEPENDENCIES.md`](DEPENDENCIES.md): qué ignora Dependabot a propósito, p. ej. jasmine 7).
- Node: 22.22.3+/24.15+/26+. **npm ≥ 11** para resolver dependencias sin lock (npm 10 falló con `edgesOut` al instalar Angular 22 desde cero).
- `npm audit`. Cada release: `CHANGELOG.md` + `version` en `package.json` (se muestra en el estado).
- Tests: `npm test` (Karma/Jasmine). Pruebas manuales: carga, filtros, mapa (incluido un enlace compartido `?view=map&shop=…`), cambio de idioma, `/2025`, Novedades, móvil y desktop.

## 7. Capturas, despliegue y cierre
1. Capturas del README con **datos ficticios**: `tools/readme-screenshots.cjs` (intercepta el API y las imágenes con comercios inventados; build con `API_BASE_URL=https://mock-api.example`) y después `python3 tools/readme-mobile-montage.py`.
2. Vercel: variables (`API_BASE_URL` con la URL del API 2027), dominio y analytics. Si el despliegue de demo tenía `--live=false`, **quitarlo**.
3. PR a `develop`, release PR `develop → master` («Merge branch 'develop' into master (release vX.Y.Z)») y tag manual.

## 8. Lo que aprendimos en 2026
- **Enlaces compartidos** (`?view=map&shop=<nombre|dirección>`): no te fíes del callback `zoomToShowLayer` de markercluster; `ShopsMapComponent.focusSelected` se acerca nivel a nivel sin animación.
- **Arranque en frío del API** (Render gratis): reintentos con esperas crecientes y aviso «despertando» (`COLD_START_CONFIG`); los tests lo inyectan sin esperas.
- **Sin zoom de página** en la app (solo en los mapas): no quites `touch-action` de Leaflet (trampa 9).
- **Estilos de cada edición bajo su clase** y **todo texto por ngx-translate en ambos idiomas**.
- No uses `DatePipe` (sin locale data): `utils/format-date.ts`.
- **El postinstall sobrescribe `ng`** (`tools/setup-ng-live.cjs`): nunca debe escribir a través de un enlace simbólico (trampa 6).

## 9. Ideas aparcadas (ramas ya hechas, sin mergear)
Siguen en el remoto de este repo; rebasarlas sobre `develop` y reabrir la PR (chocan en `CHANGELOG.md`/`package.json`):
- `claude/modificaciones-ui` — Novedades muestra los comercios «actualizados» (`modified` del API ≥ 2.8; hoy el front no los pinta).
- `claude/accesibilidad` — saltar al contenido, foco al cambiar de página, `aria-label` con el nombre del comercio, Esc en la leyenda y contraste del naranja.
- `claude/pwa` — instalable y con modo sin conexión (`@angular/service-worker`, `ngsw-config.json`); la caché se declara en la política de privacidad.
- `claude/lockfile` — versionar `package-lock.json` y usar `npm ci` en el CI.

Otras: instalar Leaflet vía npm (offline, tipos), tests de la edición 2025, mover `apiBaseUrl` a un único sitio.

## 10. Checklist final
- [ ] API en `mode: "live"` y datos reales cargando.
- [ ] Decisión sobre `/2026` tomada y aplicada (§3).
- [ ] `/2027` con textos en ambos idiomas, título por ruta y Open Graph.
- [ ] `/privacidad` revisada y fecha actualizada.
- [ ] Capturas del README ficticias regeneradas.
- [ ] Tests en verde, build de producción OK, `CHANGELOG.md` y versión.
- [ ] Release a `master` y tag subido en ambos repos.
