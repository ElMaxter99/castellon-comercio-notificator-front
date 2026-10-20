# Dependencias y Dependabot

Dependabot abre PRs contra `develop` (npm cada semana, GitHub Actions cada mes; ver `.github/dependabot.yml`).
Esta guía recoge **qué se acepta, qué se ignora a propósito y cómo revisar un PR de Dependabot**.

## Política
- **Parches y menores**: se aceptan si el CI pasa.
- **Mayores**: nunca por el CI solo. Se prueban en local (ver "Cómo revisar") y, si afectan a la API de la librería, se hacen en un PR propio con su migración.
- Conviene **unificar** las actualizaciones válidas en un solo PR antes de mergear (así se mergea y se despliega una sola vez).

## Subidas ignoradas a propósito (20-oct-2026)
| Paquete | Propuesto | Por qué no se acepta | Qué hace falta |
|---|---|---|---|
| `@angular/*` (11 paquetes) | 20 → 22 | Salto de dos mayores; además Dependabot subía TypeScript a 7 y `@angular/build` 22 exige `typescript >=6.0 <6.1`: `npm install` falla (ERESOLVE) | `ng update` de una en una (20 → 21 → 22), con TypeScript y `zone.js` de cada versión |
| `typescript` | 5.9 → 7 | Lo fija Angular (Angular 20: `>=5.8 <6.0`) | Se sube con Angular |
| `zone.js` | 0.15 → 0.16 | Angular 20 tiene como peer `~0.15` | Se sube con Angular |
| `@ngx-translate/core` | 17 → 18 | La v18 **elimina `TranslateModule`**: el build falla (`TS2724`) en todos los componentes que lo importan | Migrar a la API standalone (`TranslatePipe`/`TranslateDirective` en `imports`, `provideTranslateService(...)` en lugar de `TranslateModule.forRoot`) en todo el proyecto |
| `jasmine-core` | 5.9 → 7 | `karma-jasmine-html-reporter@2.1` exige `jasmine-core ^4 \|\| ^5`: `npm install` falla | Esperar a una versión del reporter compatible (o cambiar de reporter) |
| `@types/jasmine` | 5 → 7 | Tipos de la v7 contra el runtime 5.9: desalineados, sin ganancia | Se sube junto con `jasmine-core` |

> **Soporte de Angular**: según la política de Angular, cada mayor tiene 18 meses de soporte (6 activos + 12 de LTS). Angular 20 salió en mayo de 2025, así que su soporte termina hacia finales de noviembre de 2026 (compruébalo en <https://angular.dev/reference/releases>). Conviene planificar la migración a 21/22 junto con `ngx-translate` 18.

## Cómo revisar un PR de Dependabot (método usado)
No te fíes solo del CI: el CI del front prueba con Node 22 y el entorno real puede diferir. Para cada PR:

1. `git worktree add --detach /tmp/pr origin/dependabot/...` y `npm install` (los conflictos de dependencias —`ERESOLVE`— ya descartan el PR).
2. `npm test -- --watch=false --browsers=ChromeHeadless` y `npm run build -- --configuration=production`. Un error de compilación suele indicar una API eliminada.
3. Si la librería se ejecuta en el navegador, **comparar el comportamiento con `master`**: servir ambos builds y revisar peticiones, elementos inyectados y errores JS (así se comprobó `@vercel/analytics` 2: misma petición `/_vercel/insights/script.js`, mismo `<script>`, sin errores).
4. Leer las notas de cambios incompatibles (`CHANGELOG.md` dentro de `node_modules/<paquete>`).
5. Si hay varias válidas, aplicarlas **juntas** en una rama y repetir 2–3: el conjunto puede fallar aunque cada una pase sola.

## Actualizaciones aceptadas
- `@vercel/analytics` 1.5 → 2.0 (2.0.1): mismo comportamiento verificado en navegador.
- `actions/checkout` y `actions/setup-node`: v4 → v7 (el CI pasa con ellas).
