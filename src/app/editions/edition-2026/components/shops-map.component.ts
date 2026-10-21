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
  ViewChild,
  signal
} from '@angular/core';
import { Commerce } from '../../../models/commerce.model';
import { commerceKey, coordsFromMapsUrl } from '../../../utils/commerce-utils';
import { sectorIcon } from '../sector-icon';
import { SectorSummary } from '../edition-2026.store';
import { clusterHtml } from './map-cluster';
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
  template: `
    <div #canvas class="map" role="application" [attr.aria-label]="ariaLabel"></div>

    @if (sectors.length > 0) {
      <aside class="legend" [class.is-open]="legendOpen()" [class.is-mobile]="mobile()" [attr.aria-label]="legendLabels.title">
        <button
          type="button"
          class="legend__toggle"
          [attr.aria-expanded]="legendOpen()"
          [attr.aria-label]="legendLabels.title"
          (click)="legendOpen.set(!legendOpen())"
        >
          <span aria-hidden="true">🎨</span>
          <span class="legend__label">{{ legendLabels.title }}</span>
          @if (activeCount() > 0) {
            <span class="legend__count">{{ activeCount() }}</span>
          }
          <span class="legend__chevron" aria-hidden="true">▾</span>
        </button>

        @if (legendOpen()) {
          <div class="legend__panel">
            @if (mobile()) {
              <div class="legend__head">
                <strong>{{ legendLabels.title }}</strong>
                <button type="button" class="legend__close" [attr.aria-label]="legendLabels.close" (click)="legendOpen.set(false)">✕</button>
              </div>
            }
            <ul class="legend__list">
              <li>
                <button type="button" class="legend__chip" [attr.aria-pressed]="!activeSector" (click)="pickSector('')">
                  {{ legendLabels.all }}
                </button>
              </li>
              <li>
                <button type="button" class="legend__chip legend__chip--fav" [attr.aria-pressed]="onlyFavorites" (click)="toggleFavorites()">
                  ★ {{ legendLabels.favorites }}
                  <small>{{ favoritesCount }}</small>
                </button>
              </li>
              @for (item of sectors; track item.name) {
                <li>
                  <button
                    type="button"
                    class="legend__chip"
                    [style.--c]="item.color"
                    [attr.aria-pressed]="activeSector === item.name"
                    (click)="pickSector(item.name)"
                  >
                    <span class="legend__dot" aria-hidden="true"></span>
                    <span aria-hidden="true">{{ iconFor(item.name) }}</span>
                    {{ item.name }}
                    <small>{{ item.count }}</small>
                  </button>
                </li>
              }
            </ul>
          </div>
        }
      </aside>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        /* Contexto de apilamiento propio: los paneles y controles de Leaflet (z-index 400-1000)
           no deben quedar por encima de la cabecera fija ni de la barra inferior. */
        position: relative;
        z-index: 0;
      }
      .legend {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        z-index: 1100;
        display: grid;
        justify-items: end;
        gap: 0.4rem;
        max-width: min(18rem, calc(100% - 4.5rem));
      }
      .legend__toggle,
      .legend__chip {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.8rem;
        border: 1.5px solid rgba(30, 77, 43, 0.2);
        border-radius: 999px;
        background: #ffffff;
        color: #123524;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(18, 53, 36, 0.18);
      }
      .legend__chevron {
        transition: transform 0.2s ease;
      }
      .legend.is-open .legend__chevron {
        transform: rotate(180deg);
      }
      .legend__count {
        padding: 0 0.45rem;
        border-radius: 999px;
        background: #f77f00;
        font-size: 0.72rem;
      }
      .legend__list {
        display: grid;
        gap: 0.3rem;
        justify-items: end;
        max-height: min(22rem, 50vh);
        margin: 0;
        padding: 0.2rem;
        overflow-y: auto;
        list-style: none;
      }
      .legend__chip {
        --c: #1e4d2b;
        padding: 0.3rem 0.7rem;
        font-size: 0.78rem;
      }
      .legend__chip small {
        padding: 0 0.4rem;
        border-radius: 999px;
        background: #e9efd9;
        font-size: 0.7rem;
      }
      .legend__dot {
        width: 0.65rem;
        height: 0.65rem;
        border-radius: 50%;
        background: var(--c);
      }
      .legend__chip[aria-pressed='true'] {
        border-color: #123524;
        background: #1e4d2b;
        color: #fbfaf0;
        box-shadow: inset 0 -3px 0 var(--c), 0 4px 12px rgba(18, 53, 36, 0.18);
      }
      .legend__chip[aria-pressed='true'] small {
        background: rgba(255, 255, 255, 0.2);
      }

      /* Móvil: solo un botón redondo con el icono; la lista sale en una hoja inferior compacta
         (chips en varias líneas) en lugar de una columna que tape el mapa. */
      .legend.is-mobile {
        inset: 0;
        display: block;
        max-width: none;
        pointer-events: none;
      }
      .legend.is-mobile .legend__toggle {
        position: absolute;
        top: 0.6rem;
        right: 0.6rem;
        justify-content: center;
        width: 2.6rem;
        height: 2.6rem;
        padding: 0;
        font-size: 1.1rem;
        pointer-events: auto;
      }
      .legend.is-mobile .legend__label,
      .legend.is-mobile .legend__chevron {
        display: none;
      }
      .legend.is-mobile .legend__count {
        position: absolute;
        top: -0.25rem;
        right: -0.25rem;
      }
      .legend.is-mobile .legend__panel {
        position: absolute;
        right: 0.5rem;
        bottom: 0.5rem;
        left: 0.5rem;
        max-height: 55%;
        padding: 0.6rem 0.7rem 0.7rem;
        overflow-y: auto;
        border-radius: 1.1rem;
        background: rgba(251, 250, 240, 0.97);
        box-shadow: 0 -4px 24px rgba(18, 53, 36, 0.3);
        pointer-events: auto;
      }
      .legend__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.45rem;
        color: #123524;
        font-size: 0.9rem;
      }
      .legend__close {
        width: 2rem;
        height: 2rem;
        border: 0;
        border-radius: 50%;
        background: #e9efd9;
        color: #123524;
        font: inherit;
        cursor: pointer;
      }
      .legend.is-mobile .legend__list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        justify-content: flex-start;
        max-height: none;
        padding: 0;
        overflow: visible;
      }
      .legend.is-mobile .legend__chip {
        box-shadow: none;
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
  /** Leyenda sobre el mapa: sectores (con color y recuento), filtro activo y favoritos. */
  @Input() sectors: SectorSummary[] = [];
  @Input() activeSector = '';
  @Input() onlyFavorites = false;
  @Input() favoritesCount = 0;
  @Input() legendLabels = { title: 'Sectors', all: 'All', favorites: 'Favorites', close: 'Close' };
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
  /** Sector elegido en la leyenda (`''` = todos). */
  @Output() readonly sectorPicked = new EventEmitter<string>();
  @Output() readonly favoritesToggled = new EventEmitter<void>();

  private readonly desktopQuery = window.matchMedia?.('(min-width: 960px)');
  /** En móvil la leyenda es un botón redondo que abre una hoja inferior compacta. */
  protected readonly mobile = signal(!(this.desktopQuery?.matches ?? false));
  /** En escritorio la leyenda arranca abierta; en móvil, plegada para no tapar el mapa. */
  protected readonly legendOpen = signal(!this.mobile());
  private readonly onViewportChange = (event: MediaQueryListEvent): void => {
    this.mobile.set(!event.matches);
    this.legendOpen.set(event.matches);
  };
  protected readonly iconFor = sectorIcon;

  protected pickSector(name: string): void {
    this.sectorPicked.emit(name);
    // En móvil la hoja se cierra para ver el resultado en el mapa
    if (this.mobile()) {
      this.legendOpen.set(false);
    }
  }

  protected toggleFavorites(): void {
    this.favoritesToggled.emit();
    if (this.mobile()) {
      this.legendOpen.set(false);
    }
  }

  protected activeCount(): number {
    return Number(!!this.activeSector) + Number(this.onlyFavorites);
  }

  private map: any;
  private layer: any;
  /** Pin de cada comercio, para repintar los iconos sin volver a encuadrar el mapa. */
  private readonly pins = new Map<string, { marker: any; commerce: Commerce; html: string }>();
  /** Mientras se repintan iconos, los cierres/aperturas de popup son internos y no cambian la selección. */
  private repainting = false;

  constructor() {
    this.desktopQuery?.addEventListener?.('change', this.onViewportChange);
  }

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
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: true,
            // Sin animaciones si el sistema lo pide
            animate: !this.prefersReducedMotion(),
            // Aro segmentado por sectores con el recuento en el centro
            iconCreateFunction: (cluster: any) => {
              const colors: string[] = cluster
                .getAllChildMarkers()
                .map((marker: any) => marker.options.sectorColor as string);
              const { html, size } = clusterHtml(colors);
              return L.divIcon({ html, className: 'ed26-cluster', iconSize: L.point(size, size) });
            }
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
    this.desktopQuery?.removeEventListener?.('change', this.onViewportChange);
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
      const marker = L.marker(coords, { icon: this.pinIcon(commerce), riseOnHover: true, title: commerce.name, sectorColor: this.colorFor(commerce.sector) });
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

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private leaflet(): LeafletGlobal | null {
    return (window as typeof window & { L?: LeafletGlobal }).L ?? null;
  }
}
