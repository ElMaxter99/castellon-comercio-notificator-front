import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Commerce } from '../../models/commerce.model';
import { CommerceService } from '../../services/commerce.service';

const DEFAULT_CENTER: [number, number] = [39.986359, -0.037652];
const DEFAULT_ZOOM = 14;

@Component({
  selector: 'app-commerce-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commerce-map.component.html',
  styleUrl: './commerce-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceMapComponent implements AfterViewInit, OnDestroy {
  private readonly commerceService = inject(CommerceService);

  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer?: ElementRef<HTMLDivElement>;

  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly commerceCount = signal(0);

  private map: any;
  private markersLayer: any;
  private pendingCommerces: Commerce[] = [];
  private isMapReady = false;

  constructor() {
    this.loadCommerces();
  }

  ngAfterViewInit(): void {
    this.initialiseMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private loadCommerces(): void {
    this.commerceService
      .getCommerces()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (commerces) => {
          this.commerceCount.set(commerces.length);
          this.hasError.set(false);
          this.isLoading.set(false);
          this.renderMarkers(commerces);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  }

  private initialiseMap(): void {
    if (!this.mapContainer) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    const leaflet = this.getLeafletInstance();
    if (!leaflet) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.map = leaflet.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      attributionControl: true
    });

    leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">Colaboradores de OpenStreetMap</a>'
      })
      .addTo(this.map);

    this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    this.markersLayer = leaflet.layerGroup().addTo(this.map);
    this.isMapReady = true;

    if (this.pendingCommerces.length > 0) {
      const pending = [...this.pendingCommerces];
      this.pendingCommerces = [];
      this.renderMarkers(pending);
    }
  }

  private renderMarkers(commerces: Commerce[]): void {
    if (!this.isMapReady || !this.markersLayer) {
      this.pendingCommerces = commerces;
      return;
    }

    const leaflet = this.getLeafletInstance();
    if (!leaflet) {
      this.hasError.set(true);
      return;
    }

    this.markersLayer.clearLayers();

    const bounds = leaflet.latLngBounds([]);

    commerces.forEach((commerce) => {
      const coordinates = this.extractCoordinates(commerce.mapsUrl);
      if (!coordinates) {
        return;
      }

      const marker = leaflet.marker(coordinates, { title: commerce.name });
      marker.bindPopup(this.buildPopupContent(commerce));
      marker.addTo(this.markersLayer);
      bounds.extend(coordinates);
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [48, 48] });
    } else {
      this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }

  private extractCoordinates(url: string): [number, number] | null {
    try {
      const parsedUrl = new URL(url);
      const query = parsedUrl.searchParams.get('query');
      if (!query) {
        return null;
      }

      const [latString, lngString] = query.split(',').map((value) => value.trim());
      const latitude = Number(latString);
      const longitude = Number(lngString);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return [latitude, longitude];
    } catch (error) {
      return null;
    }
  }

  private buildPopupContent(commerce: Commerce): string {
    const safeAddress = commerce.address ? `<p class="map-popup__address">${commerce.address}</p>` : '';
    const safeSector = commerce.sector
      ? `<p class="map-popup__sector">${commerce.sector}</p>`
      : '';

    return `
      <article class="map-popup">
        <h3 class="map-popup__title">${commerce.name}</h3>
        ${safeSector}
        ${safeAddress}
      </article>
    `;
  }

  private getLeafletInstance(): any | null {
    const leaflet = (window as typeof window & { L?: any }).L;
    return leaflet ?? null;
  }
}
