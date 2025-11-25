# Estrategia de QA para el frontend

Estas recomendaciones priorizan la calidad en un proyecto Angular Material, con énfasis en trazabilidad y retroalimentación rápida.

## Alcance de pruebas
- **Unitarias**: cubrir componentes, pipes y servicios críticos usando *TestBed* y *HttpTestingController* para aislar llamadas HTTP.
- **Integración ligera**: pruebas en contenedores como `mat-sidenav` o `mat-table` para validar layout responsive y accesibilidad básica.
- **End-to-end (E2E)**: flujos clave (login, alta de avisos, filtrado de comercios) con Playwright; ejecutar en CI con perfiles *headless* y captura de trazas.

## Prácticas recomendadas
- **Doble pirámide de accesibilidad**: incluir `aria-label`, orden de tabulación y contrastes verificados con `@angular/cdk/a11y` y `axe-core` en los E2E.
- **Datos deterministas**: usar *fixtures* tipadas y `HttpTestingController` para eliminar flakiness; mockear fechas con `fakeAsync` y `tick`.
- **Cobertura significativa**: mínimo 80% en servicios y lógica de negocio; usar `nyc` o `karma-coverage` con umbrales en CI.
- **Validaciones de UI**: comprobar truncamiento con `text-overflow: ellipsis` y tooltips completos; snapshot de estilos en componentes con tarjetas/listas.
- **Seguridad**: revisar sanitización de HTML con `DomSanitizer` y activar `Content-Security-Policy` estricta en preproducción.

## Flujo en CI/CD
1. **Lint** (`npm run lint`): falla si hay `any` implícitos o estilos fuera de guía.
2. **Unitarias** (`npm test -- --watch=false --browsers=ChromeHeadless`): publicar reportes JUnit y cobertura en artefactos.
3. **Build** (`npm run build`): asegura que los budgets de rendimiento no se excedan.
4. **E2E opcional** (`npm run e2e` con Playwright): sólo en ramas principales o antes de releases.
5. **Auditoría**: ejecutar `npm run analyze` o `ng build --stats-json` + `webpack-bundle-analyzer` para detectar regresiones de peso.

## Métricas y seguimiento
- **Tiempo de feedback**: <10 minutos para lint + unitarias en PRs.
- **Flakiness**: registrar pruebas inestables y aplicar *retry* controlado en E2E.
- **Defectos por módulo**: etiquetar incidencias por componente/feature para priorizar refactors.

## Herramientas sugeridas
- `@angular-eslint/schematics` para linting consistente.
- `playwright` + `@playwright/test` para E2E en paralelo.
- `axe-core` para accesibilidad automatizada.
- `msw` o `json-server` para mocks de API reproducibles.

## Checklist para PR
- [ ] Lint sin advertencias.
- [ ] Cobertura respetando umbrales definidos.
- [ ] Capturas o grabaciones de los flujos modificados.
- [ ] Notas de accesibilidad cuando se toquen componentes interactivos.
- [ ] Resultados de E2E (si aplica) adjuntos como artefactos.
