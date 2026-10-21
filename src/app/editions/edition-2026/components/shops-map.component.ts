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
  @Input() directionsLabel = 'Google Maps';
  @Input() ariaLabel = '';
  @Output() readonly commerceSelected = new EventEmitter<Commerce>();

  private map: any;
  private layer: any;
  /** Pin de cada comercio, para repintar los iconos sin volver a encuadrar el mapa. */
  private readonly pins = new Map<string, { marker: any; commerce: Commerce }>();

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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) {
      return;
    }
    if (changes['commerces']) {
      this.render();
    } else if (changes['favorites']) {
      this.refreshIcons();
    }
  }

  ngOnDestroy(): void {
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
      const marker = L.marker(coords, { icon: this.pinIcon(commerce), riseOnHover: true });
      marker.bindPopup(this.popup(commerce));
      marker.on('click', () => this.commerceSelected.emit(commerce));
      marker.addTo(this.layer);
      this.pins.set(commerceKey(commerce), { marker, commerce });
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

  /** Icono del pin: color e icono del sector, y estrella si es favorito. */
  private pinIcon(commerce: Commerce): any {
    const L = this.leaflet();
    return L.divIcon({
      html: pinHtml({
        color: this.colorFor(commerce.sector),
        icon: sectorIcon(commerce.sector),
        favorite: this.favorites.has(commerceKey(commerce))
      }),
      className: 'ed26-pin-wrap',
      iconSize: PIN_SIZE,
      iconAnchor: PIN_ANCHOR,
      popupAnchor: [0, -40]
    });
  }

  /** Repinta los iconos (p. ej. al guardar un favorito) sin mover el mapa. */
  private refreshIcons(): void {
    for (const { marker, commerce } of this.pins.values()) {
      marker.setIcon(this.pinIcon(commerce));
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
    const root = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = commerce.name;
    root.append(title);

    for (const text of [commerce.sector, commerce.address]) {
      if (text) {
        const line = document.createElement('div');
        line.textContent = text;
        root.append(line);
      }
    }
    if (commerce.mapsUrl) {
      const link = document.createElement('a');
      link.href = commerce.mapsUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `${this.directionsLabel} →`;
      root.append(link);
    }
    return root;
  }

  private leaflet(): LeafletGlobal | null {
    return (window as typeof window & { L?: LeafletGlobal }).L ?? null;
  }
}
