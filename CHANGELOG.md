# Changelog

Todas las novedades relevantes del proyecto se documentan en este archivo siguiendo el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y utilizando [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] - 2024-11-24

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

### Cambiado

- Documentación del proyecto renovada para reflejar el alcance de la versión 1.0.0.

[1.0.0]: https://github.com/alvaromaxter/castellon-comercio-notificator-front/releases/tag/v1.0.0