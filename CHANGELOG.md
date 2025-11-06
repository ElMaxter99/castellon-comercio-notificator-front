# Changelog

## [v1.1.1](https://github.com/ElMaxter99/castellon-comercio-notificator-front/releases/tag/v1.1.1) - 2025-11-06

### Añadido
- Add reusable loading spinner for API call states #15hours ago
- Configure environment-specific API endpoints #13
- Add brand navigation button and auto-scroll on history view 

### Correciones 
- Fix list view layout for commerce grid #14

## [v1.1.0](https://github.com/ElMaxter99/castellon-comercio-notificator-front/releases/tag/v1.1.0) - 2025-11-04

### Añadido

- Feat: add Valencian language support #9
- Add vercel analytics #10
- Fix responsive movil #11

## [v1.0.0](https://github.com/ElMaxter99/castellon-comercio-notificator-front/releases/tag/v1.0.0) - 2025-11-03

### Añadido

- Explorador principal con filtros por nombre, sector y dirección para los comercios adheridos.
- Componente de tarjeta reutilizable con vista en cuadrícula o lista y manejo de imágenes de respaldo.
- Integración de Leaflet para mostrar un mapa interactivo con leyenda filtrable por sectores.
- Sistema de paginación configurable (12, 24 y 48 elementos) con control de estado (`signal`).
- Panel de estado global que consulta el total de comercios, el entorno y la fecha de actualización.
- Historial completo de altas y bajas con resumen y contadores de movimientos.
- Gestión centralizada de estados de carga y error en servicios y componentes visuales.
- Normalización automática de URLs (HTTP → HTTPS) antes de mostrarlas en la interfaz.
- Estilos responsive y accesibles con soporte para mensajes ARIA en estados críticos.