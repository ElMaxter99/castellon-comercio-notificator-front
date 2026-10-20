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
import { coordsFromMapsUrl } from '../../../utils/commerce-utils';

const DEFAULT_CENTER: [number, number] = [39.986359, -0.037652];
const DEFAULT_ZOOM = 14;

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
  @Input() directionsLabel = 'Google Maps';
  @Input() ariaLabel = '';
  @Output() readonly commerceSelected = new EventEmitter<Commerce>();

  private map: any;
  private layer: any;

  ngAfterViewInit(): void {
    const L = this.leaflet();
    if (!L) {
      return;
    }
    this.map = L.map(this.canvas.nativeElement).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);
    this.layer = L.layerGroup().addTo(this.map);
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && changes['commerces']) {
      this.render();
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
    const bounds = L.latLngBounds([]);

    for (const commerce of this.commerces) {
      const coords = coordsFromMapsUrl(commerce.mapsUrl);
      if (!coords) {
        continue;
      }
      const color = this.colorFor(commerce.sector);
      const marker = L.circleMarker(coords, {
        radius: 8,
        weight: 2,
        color: '#FBFAF0',
        fillColor: color,
        fillOpacity: 0.95
      });
      marker.bindPopup(this.popup(commerce));
      marker.on('click', () => this.commerceSelected.emit(commerce));
      marker.addTo(this.layer);
      bounds.extend(coords);
    }

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    } else {
      this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
    // El contenedor puede haber cambiado de tamaño al mostrarse.
    setTimeout(() => this.map?.invalidateSize(), 0);
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
