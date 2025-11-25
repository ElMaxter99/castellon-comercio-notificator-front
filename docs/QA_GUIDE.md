# Guía rápida de QA

Esta guía resume las comprobaciones de calidad recomendadas para el front de Castellón Comercio Notificator. El objetivo es asegurar que cada entrega mantiene la accesibilidad, el rendimiento y la estabilidad visual de la aplicación.

## 1. Pirámide de pruebas sugerida
- **Linting y formato (base):** ejecutar `npm run lint` cuando se añada (o `ng lint` si se habilita en el futuro). Garantiza consistencia de estilo y facilita la revisión.
- **Pruebas unitarias (núcleo):** `npm test` mantiene la cobertura de componentes, pipes y servicios críticos (p. ej., `CommerceService`). Añade pruebas para los estados de carga y errores.
- **Pruebas exploratorias (cima):** revisa flujos clave en un navegador real tras cada cambio relevante (filtros, cambio de vista, mapa y paginación).

## 2. Checklist funcional rápida
- **Filtros**: combinar nombre, sector y dirección produce resultados coherentes y reiniciar filtros limpia el estado del listado.
- **Vista de mapa**: la carga de Leaflet no bloquea la UI y los marcadores coinciden con el listado.
- **Paginación**: el selector 12/24/48 actualiza el recuento y los indicadores de página sin desbordar en móvil.
- **Histórico**: los cambios recientes aparecen ordenados por fecha y muestran mensajes de error claros si la API falla.
- **Modo mock**: el banner de datos simulados es visible y las rutas funcionan sin depender de la API real.

## 3. Accesibilidad y UI
- Verifica que todos los elementos interactivos tengan `aria-label` y foco visible.
- Comprueba el contraste mínimo (WCAG AA) en botones de filtros y tarjetas.
- Asegura que los estados de carga y error sean anunciados por lectores de pantalla (role="status" o similar).
- Si se introduce texto truncado, añade tooltip con el contenido completo.

## 4. Rendimiento y red
- Evita llamadas HTTP duplicadas al navegar entre rutas: reutiliza servicios y usa caching ligero si es necesario.
- Revisa que las URLs se normalicen a HTTPS antes de renderizarse (como hace el `CommerceService`).
- En mapas, limita la cantidad de marcadores visibles cuando se use paginación o filtros agresivos.

## 5. Datos de prueba recomendados
- **Comercio con URL insegura** para validar normalización.
- **Comercio sin coordenadas** para comprobar mensajes de error/placeholder en el mapa.
- **Histórico con altas y bajas recientes** para verificar orden y conteo.
- **Entorno sin API** ejecutando `npm start -- --live=false` para evaluar el modo mock.

## 6. Flujo sugerido antes de hacer commit
1. Ejecuta `npm test` y revisa que todas las suites pasen.
2. Realiza una pasada de accesibilidad rápida con las herramientas del navegador (Lighthouse/axe).
3. Valida manualmente los flujos de filtros, mapa, paginación e histórico.
4. Adjunta en la PR breves notas sobre qué se probó y resultados.

Mantener esta disciplina reduce regresiones y facilita la revisión de cambios en la interfaz.
