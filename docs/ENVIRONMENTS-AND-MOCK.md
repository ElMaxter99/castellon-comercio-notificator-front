# Entornos y modo mock

## Ficheros de entorno (`src/environments/`)
`environment.ts` es el que importa el código; `angular.json` lo reemplaza (`fileReplacements`) según la configuración.

| Configuración Angular | Reemplaza por | `mode` | `apiBaseUrl` | `isLive` |
|---|---|---|---|---|
| `development` (por defecto) | — (`environment.ts`) | development | `http://localhost:12001` | true |
| `development-mock` | `environment.mock.ts` | development-mock | `http://localhost:12001` | false |
| `production` | `environment.prod.ts` | production | `https://bcc-api.alvaromaxter.es` | true |
| `production-mock` | `environment.mock.prod.ts` | production-mock | idem | false |
| `test` | `environment.test.ts` | test | `https://bcc-api.alvaromaxter.es` | true |
| `test-mock` | `environment.mock.test.ts` | test-mock | idem | false |

`isLive` decide en `CommerceService` si se llama al API o se leen los JSON de `public/mockup/`. Con `isLive=false` el layout muestra un aviso persistente ("datos ilustrativos").

## El flag `--live`
`npm start|build|test` y los comandos `ng ...` pasan por `tools/ng-live.cjs`:
- `--live` ausente o `--live=true` → no cambia nada.
- `--live=false` (también `0|no|off`) → añade/convierte `--configuration` a la variante `-mock` (`development`→`development-mock`, `production`→`production-mock`...). Si no se indica configuración, usa `development` para `build`/`serve`.
- `tools/setup-ng-live.cjs` (postinstall) renombra `node_modules/.bin/ng` a `ng-real` y pone un wrapper (Unix y Windows) para que `ng build --live=false` funcione en pipelines (Vercel).

## Recetas
```bash
npm start                                   # API local :12001
npm start -- --live=false                   # mock
npm run build -- --configuration=production # prod real
npm run build -- --configuration=production --live=false  # demo con mock
# En CI/Vercel:
ng build --configuration=$NG_BUILD_CONFIG --live=false
```
Salida en `dist/castellon-comercio-notificator-front/` (builder `application`: contenido en `browser/`).

## Fixtures mock (`public/mockup/`)
- `commerces.json`: pocos comercios de ejemplo (6) con la forma de `Commerce`; sus `mapsUrl` deben incluir `query=lat,lng` para ver marcadores.
- `status.json`, `history.json`: formas de `CommerceStatus` y `CommerceHistoryEntry[]`.
Cambia estos ficheros para demos; no requieren compilar de nuevo el API.

## Presupuestos de build (producción)
Inicial: aviso 500 kB, error 1 MB. Estilos por componente: aviso 10 KB, error 15 KB.
