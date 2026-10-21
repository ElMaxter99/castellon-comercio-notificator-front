/**
 * Bloquea el zoom de pellizco de la página (iOS Safari ignora `user-scalable=no`, por eso se
 * cancelan sus eventos `gesture*`). Los mapas (`.leaflet-container`) quedan exentos: ahí el zoom
 * lo hace Leaflet.
 */
export function disablePageZoom(target: Document = document): void {
  const block = (event: Event): void => {
    const element = event.target instanceof Element ? event.target : null;
    if (!element?.closest('.leaflet-container')) {
      event.preventDefault();
    }
  };
  for (const name of ['gesturestart', 'gesturechange', 'gestureend']) {
    target.addEventListener(name, block, { passive: false });
  }
}
