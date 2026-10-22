# Dependencias y Dependabot

Dependabot abre PRs contra `develop` (npm cada semana, GitHub Actions cada mes; ver `.github/dependabot.yml`).
Esta guía recoge **qué se acepta, qué se ignora a propósito y cómo revisar un PR de Dependabot**.

## Política
- **Parches y menores**: se aceptan si el CI pasa.
- **Mayores**: nunca por el CI solo. Se prueban en local (ver "Cómo revisar") y, si afectan a la API de la librería, se hacen en un PR propio con su migración.
- Conviene **unificar** las actualizaciones válidas en un solo PR antes de mergear (así se mergea y se despliega una sola vez).

## Subidas ignoradas a propósito (21-oct-2026)
| Paquete | Propuesto | Por qué no se acepta | Qué hace falta |
|---|---|---|---|
| `@angular/*` (11 paquetes) | 22 → 23… | Cada mayor se sube con `ng update`, de una en una, junto con TypeScript y `zone.js` | Repetir el proceso de abajo cuando salga el siguiente mayor |
| `typescript` | 6.0 → 7 | Lo fija Angular (Angular 22: `>=6.0 <6.1`) | Se sube con Angular |
| `jasmine-core` | 5.13 → 7 | Con Jasmine 7 (y `@types/jasmine` 7, y `karma-jasmine-html-reporter` 2.3) **los tests no arrancan** aunque se use `zone.js` 0.16: el parche de Jasmine de `zone-testing` falla con `Cannot assign to read only property 'describe'` (probado el 21-oct-2026) | Esperar a un `zone.js`/Angular que lo soporte y repetir la prueba |
| `@types/jasmine` | 5 → 7 | Va con `jasmine-core` | Se sube junto con `jasmine-core` |

> **Soporte de Angular**: cada mayor tiene 18 meses de soporte (6 activos + 12 de LTS). Angular 22 es la versión vigente (migrada el 21-oct-2026); consulta las fechas en <https://angular.dev/reference/releases>. Angular exige Node `^22.22.3 || ^24.15 || >=26`.

## Cómo se migró a Angular 22 (20 → 22)
1. Subir de **una versión mayor cada vez** (20 → 21 → 22), probando tests y build en cada paso. Con `ng update @angular/core@N @angular/cli@N`, o editando `package.json` y reinstalando.
2. En este entorno el `npm` 10 falló al resolver peers (`Cannot read properties of null (reading 'edgesOut')`); con **npm 11** instaló bien. Si te pasa, borra `node_modules` y usa npm 11 (`npm ci` con el lock versionado funciona también con npm 10).
3. Las migraciones automáticas de `ng update` que se probaron (flujo de control `@if`, `withXhr`, supresión de diagnósticos) **no hacían falta** y se descartaron para no tocar la edición 2025.
4. Cambios de código necesarios: ninguno hasta Angular 22 + TypeScript 6; con **ngx-translate 18** (elimina `TranslateModule`): `TranslatePipe` en los `imports` de cada componente, `provideTranslateService({ fallbackLang })` + `provideTranslateLoader(...)` en `app.config.ts`, `currentLang` pasa a ser una *signal* y `setDefaultLang` desaparece (el idioma de respaldo va en la config). En los tests, `provideTranslateService()` en lugar de `TranslateModule.forRoot()`.
5. Verificado: 51 tests, builds de producción (con y sin `--live=false`) y la app en navegador en castellano y valencià (sin claves sin traducir ni errores JS).

## Cómo revisar un PR de Dependabot (método usado)
No te fíes solo del CI: el CI del front prueba con Node 22 y el entorno real puede diferir. Para cada PR:

1. `git worktree add --detach /tmp/pr origin/dependabot/...` y `npm install` (los conflictos de dependencias —`ERESOLVE`— ya descartan el PR).
2. `npm test -- --watch=false --browsers=ChromeHeadless` y `npm run build -- --configuration=production`. Un error de compilación suele indicar una API eliminada.
3. Si la librería se ejecuta en el navegador, **comparar el comportamiento con `master`**: servir ambos builds y revisar peticiones, elementos inyectados y errores JS (así se comprobó `@vercel/analytics` 2: misma petición `/_vercel/insights/script.js`, mismo `<script>`, sin errores).
4. Leer las notas de cambios incompatibles (`CHANGELOG.md` dentro de `node_modules/<paquete>`).
5. Si hay varias válidas, aplicarlas **juntas** en una rama y repetir 2–3: el conjunto puede fallar aunque cada una pase sola.

## Actualizaciones aceptadas
- Angular 20 → 22, TypeScript 5.9 → 6.0, `zone.js` 0.15 → 0.16 y `@ngx-translate/core` 17 → 18 (ver «Cómo se migró»).
- `@vercel/analytics` 1.5 → 2.0 (2.0.1): mismo comportamiento verificado en navegador.
- `jasmine-core` 5.13 y `karma-jasmine-html-reporter` 2.3 (menores; tests y build correctos).
- `actions/checkout` y `actions/setup-node`: v4 → v7 (el CI pasa con ellas).
