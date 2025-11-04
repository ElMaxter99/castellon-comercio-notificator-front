import { CommonModule } from '@angular/common';
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
import { TranslateModule } from '@ngx-translate/core';
import { Commerce } from '../../models/commerce.model';
import { LanguageService } from '../../services/language.service';

const DEFAULT_CENTER: [number, number] = [39.986359, -0.037652];
const DEFAULT_ZOOM = 14;

@Component({
  selector: 'app-commerce-map',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './commerce-map.component.html',
  styleUrl: './commerce-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceMapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer?: ElementRef<HTMLDivElement>;

  @Input({ required: true })
  set commerces(value: Commerce[]) {
    this.pendingCommerces = value ?? [];
    this.renderMarkers(value ?? []);
  }

  @Input()
  set legendSource(value: Commerce[] | null) {
    const source = Array.isArray(value) ? value : [];
    this.buildLegend(source);
  }

  @Input()
  set selectedSector(value: string | null) {
    const trimmed = value?.trim() ?? '';
    const locale = this.getLocale();
    const normalised = trimmed ? trimmed.toLocaleLowerCase(locale) : null;
    this.activeSector.set(normalised);
    this.applyLegendFilter();
  }

  @Input() totalCount = 0;
  @Input() filteredCount = 0;
  @Input() isDataLoading = false;
  @Input() hasDataError = false;

  @Output() readonly sectorFilterChange = new EventEmitter<string | null>();

  private map: any;
  private markersLayer: any;
  private pendingCommerces: Commerce[] = [];
  private isMapReady = false;
  private readonly sectorPalette = [
    '#22d3ee',
    '#a855f7',
    '#f97316',
    '#facc15',
    '#38bdf8',
    '#f472b6',
    '#34d399',
    '#60a5fa',
    '#f43f5e',
    '#c084fc'
  ];
  private sectorColorMap = new Map<string, string>();
  private markerEntries: Array<{ marker: any; sector: string; color: string }> = [];

  protected readonly isLoading = signal(true);
  protected readonly legend = signal<Array<{ sector: string; color: string; count: number }>>([]);
  protected readonly activeSector = signal<string | null>(null);

  constructor(private readonly languageService: LanguageService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['commerces'] && !changes['commerces'].firstChange) {
      this.renderMarkers(this.pendingCommerces);
    }
  }

  ngAfterViewInit(): void {
    this.initialiseMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initialiseMap(): void {
    if (!this.mapContainer) {
      this.isLoading.set(false);
      return;
    }

    const leaflet = this.getLeafletInstance();
    if (!leaflet) {
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
    this.isLoading.set(false);

    if (this.pendingCommerces.length > 0) {
      const pending = [...this.pendingCommerces];
      this.pendingCommerces = [];
      this.renderMarkers(pending);
    }
  }

  private renderMarkers(commerces: Commerce[]): void {
    if (!Array.isArray(commerces)) {
      return;
    }

    if (!this.isMapReady || !this.markersLayer) {
      this.pendingCommerces = [...commerces];
      return;
    }

    const leaflet = this.getLeafletInstance();
    if (!leaflet) {
      return;
    }

    this.markersLayer.clearLayers();
    this.markerEntries = [];

    const bounds = leaflet.latLngBounds([]);

    const locale = this.getLocale();

    commerces.forEach((commerce) => {
      const coordinates = this.extractCoordinates(commerce.mapsUrl);
      if (!coordinates) {
        return;
      }

      const color = this.getColorForSector(commerce.sector);
      const marker = leaflet.circleMarker(coordinates, {
        title: commerce.name,
        radius: 8,
        weight: 2,
        color,
        opacity: 0.95,
        fillOpacity: 0.8,
        fillColor: color
      });
      marker.bindPopup(this.buildPopupContent(commerce));
      marker.addTo(this.markersLayer);
      bounds.extend(coordinates);

      this.markerEntries.push({
        marker,
        sector: commerce.sector.trim().toLocaleLowerCase(locale),
        color
      });
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [48, 48] });
    } else {
      this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
    this.applyLegendFilter();
  }

  protected onLegendToggle(sector: string): void {
    const trimmed = sector.trim();
    const locale = this.getLocale();
    const normalised = trimmed.toLocaleLowerCase(locale);
    const current = this.activeSector();
    const next = current === normalised ? null : normalised;
    this.activeSector.set(next);
    this.applyLegendFilter();
    this.sectorFilterChange.emit(next ? trimmed : null);
  }

  protected onLegendReset(): void {
    if (!this.activeSector()) {
      return;
    }
    this.activeSector.set(null);
    this.applyLegendFilter();
    this.sectorFilterChange.emit(null);
  }

  protected isLegendEntryActive(sector: string): boolean {
    const active = this.activeSector();
    if (!active) {
      return false;
    }
    const locale = this.getLocale();
    return active === sector.trim().toLocaleLowerCase(locale);
  }

  protected isLegendEntryDimmed(sector: string): boolean {
    const active = this.activeSector();
    if (!active) {
      return false;
    }
    const locale = this.getLocale();
    return active !== sector.trim().toLocaleLowerCase(locale);
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

  private getColorForSector(sector: string): string {
    const locale = this.getLocale();
    const key = sector.trim().toLocaleLowerCase(locale);
    if (!key) {
      return '#38bdf8';
    }

    const existing = this.sectorColorMap.get(key);
    if (existing) {
      return existing;
    }

    const nextColor = this.sectorPalette[this.sectorColorMap.size % this.sectorPalette.length];
    this.sectorColorMap.set(key, nextColor);
    return nextColor;
  }

  private buildLegend(commerces: Commerce[]): void {
    const locale = this.getLocale();
    this.sectorColorMap = new Map<string, string>();
    const accumulator = new Map<string, { color: string; count: number }>();

    commerces.forEach((commerce) => {
      const sector = commerce.sector.trim();
      if (!sector) {
        return;
      }
      const color = this.getColorForSector(sector);
      const existing = accumulator.get(sector);
      if (existing) {
        existing.count += 1;
      } else {
        accumulator.set(sector, { color, count: 1 });
      }
    });

    const legendEntries = Array.from(accumulator.entries())
      .map(([sector, value]) => ({ sector, ...value }))
      .sort((a, b) => a.sector.localeCompare(b.sector, locale));

    this.legend.set(legendEntries);

    const active = this.activeSector();
    if (active && !legendEntries.some((entry) => entry.sector.toLocaleLowerCase(locale) === active)) {
      this.activeSector.set(null);
      this.sectorFilterChange.emit(null);
    }

    this.applyLegendFilter();
  }

  private getLocale(): string {
    return this.languageService.currentLocale();
  }

  private applyLegendFilter(): void {
    const active = this.activeSector();

    if (!this.markersLayer || this.markerEntries.length === 0) {
      return;
    }

    this.markerEntries.forEach(({ marker, sector, color }) => {
      const isActive = !active || active === sector;
      marker.setStyle({
        color,
        fillColor: color,
        opacity: isActive ? 0.95 : 0.25,
        fillOpacity: isActive ? 0.8 : 0.15
      });
      if (isActive) {
        marker.bringToFront?.();
      }
    });
  }
}
