import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Commerce } from '../../../models/commerce.model';
import { commerceKey, coordsFromMapsUrl } from '../../../utils/commerce-utils';
import { sectorIcon } from '../sector-icon';
import { PIN_ANCHOR, PIN_SIZE, pinHtml } from './map-pin';
import { ShopPopupLabels, buildShopPopup } from './shop-popup';

const DEFAULT_CENTER: [number, number] = [39.986359, -0.037652];
const DEFAULT_ZOOM = 14;
/** Radio (en grados, ≈ 28 km) alrededor de la mediana dentro del cual se encuadra el mapa. */
const FIT_RADIUS_DEGREES = 0.25;
/** A este zoom o menos, los pines se dibujan más pequeños. */
const FAR_ZOOM = 13;

type LeafletGlobal = any;

/** Mapa Leaflet de la edición 2026. El popup se construye con nodos DOM (sin HTML interpolado). */
@Component({
  selector: 'app-shops-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #canvas class="map" role="application" [attr.aria-label]="ariaLabel"></div>`,
  styles: [
    `
      :host {
        display: block;
        /* Contexto de apilamiento propio: los paneles y controles de Leaflet (z-index 400-1000)
           no deben quedar por encima de la cabecera fija ni de la barra inferior. */
        position: relative;
        z-index: 0;
      }
      .map {
        height: clamp(22rem, 65vh, 40rem);
        border-radius: 1.25rem;
        border: 1px solid rgba(30, 77, 43, 0.16);
        overflow: hidden;
        background: #e9efd9;
      }
    `
  ]
})
export class ShopsMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) private readonly canvas!: ElementRef<HTMLDivElement>;

  @Input({ required: true }) commerces: Commerce[] = [];
  @Input() colorFor: (sector: string) => string = () => '#1E4D2B';
  /** Claves (`commerceKey`) de los comercios favoritos: llevan una estrella sobre el pin. */
  @Input() favorites: ReadonlySet<string> = new Set();
  /** Clave (`commerceKey`) del comercio seleccionado: pin destacado y popup abierto. */
  @Input() selectedKey: string | null = null;
  @Input() popupLabels: ShopPopupLabels = {
    directions: 'Google Maps',
    call: 'Call',
    favoriteAdd: 'Save',
    favoriteRemove: 'Remove',
    viewInList: 'List'
  };
  @Input() ariaLabel = '';
  @Output() readonly commerceSelected = new EventEmitter<Commerce>();
  /** Se cerró el popup del comercio seleccionado. */
  @Output() readonly selectionCleared = new EventEmitter<void>();
  @Output() readonly favoriteToggled = new EventEmitter<Commerce>();
  @Output() readonly viewInList = new EventEmitter<Commerce>();

  private map: any;
  private layer: any;
  /** Pin de cada comercio, para repintar los iconos sin volver a encuadrar el mapa. */
  private readonly pins = new Map<string, { marker: any; commerce: Commerce; html: string }>();
  /** Mientras se repintan iconos, los cierres/aperturas de popup son internos y no cambian la selección. */
  private repainting = false;

  ngAfterViewInit(): void {
    const L = this.leaflet();
    if (!L) {
      return;
    }
    this.map = L.map(this.canvas.nativeElement).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    this.map.on('zoomend', () => this.updateZoomClass());
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);
    // Con el plugin markercluster (cargado desde index.html) los comercios cercanos se agrupan.
    this.layer = (
      L.markerClusterGroup
        ? L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 50,
            iconCreateFunction: (cluster: any) =>
              L.divIcon({
                html: `<span>${cluster.getChildCount()}</span>`,
                className: 'ed26-cluster',
                iconSize: L.point(42, 42)
              })
          })
        : L.layerGroup()
    ).addTo(this.map);
    this.render();
    this.applySelection();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) {
      return;
    }
    if (changes['commerces']) {
      this.render();
    } else if (changes['favorites'] || changes['popupLabels']) {
      this.refreshIcons();
    }
    if (changes['selectedKey'] || changes['commerces']) {
      this.applySelection();
    }
  }

  ngOnDestroy(): void {
    // Al destruir el mapa Leaflet cierra los popups: no debe tomarse como «deseleccionar»
    this.repainting = true;
    this.map?.remove();
  }

  private render(): void {
    const L = this.leaflet();
    if (!L) {
      return;
    }
    this.layer.clearLayers();
    this.pins.clear();
    const allCoords: Array<[number, number]> = [];

    for (const commerce of this.commerces) {
      const coords = coordsFromMapsUrl(commerce.mapsUrl);
      if (!coords) {
        continue;
      }
      const marker = L.marker(coords, { icon: this.pinIcon(commerce), riseOnHover: true, title: commerce.name });
      marker.bindPopup(this.popup(commerce));
      // `popupopen` (y no `click`) para que también cuente abrirlo con el teclado (Enter)
      marker.on('popupopen', () => {
        if (!this.repainting && this.selectedKey !== commerceKey(commerce)) {
          this.commerceSelected.emit(commerce);
        }
      });
      marker.on('popupclose', () => {
        if (!this.repainting && this.selectedKey === commerceKey(commerce)) {
          this.selectionCleared.emit();
        }
      });
      // Accesibilidad: el icono es un div; se anuncia como botón con su nombre y sector.
      marker.on('add', () => {
        const element: HTMLElement | undefined = marker.getElement?.();
        element?.setAttribute('role', 'button');
        element?.setAttribute('aria-label', commerce.sector ? `${commerce.name}, ${commerce.sector}` : commerce.name);
      });
      marker.addTo(this.layer);
      this.pins.set(commerceKey(commerce), { marker, commerce, html: this.pinMarkup(commerce) });
      allCoords.push(coords);
    }

    const fitCoords = this.mainArea(allCoords);
    if (fitCoords.length > 0) {
      this.map.fitBounds(L.latLngBounds(fitCoords), { padding: [40, 40], maxZoom: 17 });
    } else {
      this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
    // El contenedor puede haber cambiado de tamaño al mostrarse.
    setTimeout(() => this.map?.invalidateSize(), 0);
    this.updateZoomClass();
  }

  private pinMarkup(commerce: Commerce): string {
    return pinHtml({
      color: this.colorFor(commerce.sector),
      icon: sectorIcon(commerce.sector),
      favorite: this.favorites.has(commerceKey(commerce)),
      selected: this.selectedKey === commerceKey(commerce)
    });
  }

  /** Icono del pin: color e icono del sector, y estrella si es favorito. */
  private pinIcon(commerce: Commerce): any {
    const L = this.leaflet();
    return L.divIcon({
      html: this.pinMarkup(commerce),
      className: 'ed26-pin-wrap',
      iconSize: PIN_SIZE,
      iconAnchor: PIN_ANCHOR,
      popupAnchor: [0, -40]
    });
  }

  /** Repinta los iconos (p. ej. al guardar un favorito) sin mover el mapa. */
  private refreshIcons(): void {
    this.repainting = true;
    try {
      for (const pin of this.pins.values()) {
        const html = this.pinMarkup(pin.commerce);
        const wasOpen = pin.marker.isPopupOpen?.() ?? false;
        pin.marker.setPopupContent(this.popup(pin.commerce));
        if (html !== pin.html) {
          pin.html = html;
          // `setIcon` vuelve a enlazar el popup y lo cierra: se reabre si estaba abierto
          pin.marker.setIcon(this.pinIcon(pin.commerce));
          if (wasOpen) {
            pin.marker.openPopup();
          }
        }
      }
    } finally {
      this.repainting = false;
    }
  }

  /** Destaca el pin seleccionado, lo centra y abre su popup (también si está dentro de un clúster). */
  private applySelection(): void {
    this.refreshIcons();
    const entry = this.selectedKey ? this.pins.get(this.selectedKey) : undefined;
    if (!entry || !this.map) {
      return;
    }
    const open = (): void => {
      this.map.panTo(entry.marker.getLatLng(), { animate: true });
      entry.marker.openPopup();
    };
    if (this.layer?.zoomToShowLayer) {
      this.layer.zoomToShowLayer(entry.marker, open);
    } else {
      open();
    }
  }

  /** Con el mapa muy alejado los pines se reducen un poco. */
  private updateZoomClass(): void {
    this.map?.getContainer().classList.toggle('ed26-map--far', this.map.getZoom() <= FAR_ZOOM);
  }

  /**
   * Puntos que rodean a la mediana. Unos pocos comercios con coordenadas erróneas
   * (mal geocodificados en el origen) no deben alejar el zoom de la zona principal;
   * siguen dibujados en el mapa, solo quedan fuera del encuadre inicial.
   */
  private mainArea(coords: Array<[number, number]>): Array<[number, number]> {
    if (coords.length === 0) {
      return coords;
    }
    const median = (values: number[]): number => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };
    const centerLat = median(coords.map(([lat]) => lat));
    const centerLng = median(coords.map(([, lng]) => lng));
    const near = coords.filter(
      ([lat, lng]) => Math.abs(lat - centerLat) <= FIT_RADIUS_DEGREES && Math.abs(lng - centerLng) <= FIT_RADIUS_DEGREES
    );
    return near.length > 0 ? near : coords;
  }

  private popup(commerce: Commerce): HTMLElement {
    const key = commerceKey(commerce);
    return buildShopPopup({
      commerce,
      color: this.colorFor(commerce.sector),
      favorite: this.favorites.has(key),
      labels: this.popupLabels,
      onToggleFavorite: () => this.favoriteToggled.emit(commerce),
      onViewInList: () => this.viewInList.emit(commerce)
    });
  }

  private leaflet(): LeafletGlobal | null {
    return (window as typeof window & { L?: LeafletGlobal }).L ?? null;
  }
}
