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
  computed,
  signal
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Commerce } from '../../models/commerce.model';
import { LanguageService } from '../../services/language.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

const DEFAULT_CENTER: [number, number] = [39.986359, -0.037652];
const DEFAULT_ZOOM = 14;
const PREVIEW_LIMIT = 6;

type MarkerEntry = {
  key: string;
  marker: any;
  sectorKey: string;
  color: string;
  commerce: Commerce;
};

@Component({
  selector: 'app-commerce-map',
  standalone: true,
  imports: [CommonModule, TranslateModule, LoadingSpinnerComponent],
  templateUrl: './commerce-map.component.html',
  styleUrl: './commerce-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceMapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer?: ElementRef<HTMLDivElement>;

  @Input({ required: true })
  set commerces(value: Commerce[]) {
    const list = Array.isArray(value) ? value : [];
    this.pendingCommerces = list;
    this.visibleCommerces.set(list);

    if (this.selectedCommerceKey && !this.containsCommerceWithKey(list, this.selectedCommerceKey)) {
      this.clearSelection();
    }

    this.renderMarkers(list);
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
  private markerEntries: MarkerEntry[] = [];
  private markerLookup = new Map<string, MarkerEntry>();
  private selectedCommerceKey: string | null = null;
  private selectedCommerceSector: string | null = null;

  protected readonly isLoading = signal(true);
  protected readonly legend = signal<Array<{ sector: string; color: string; count: number }>>([]);
  protected readonly activeSector = signal<string | null>(null);
  protected readonly selectedCommerce = signal<Commerce | null>(null);
  protected readonly visibleCommerces = signal<Commerce[]>([]);
  protected readonly previewCommerces = computed(() => this.visibleCommerces().slice(0, PREVIEW_LIMIT));
  protected readonly additionalResults = computed(() =>
    Math.max(this.visibleCommerces().length - PREVIEW_LIMIT, 0)
  );

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
    this.markerLookup = new Map<string, MarkerEntry>();

    const bounds = leaflet.latLngBounds([]);

    const locale = this.getLocale();

    commerces.forEach((commerce) => {
      const coordinates = this.extractCoordinates(commerce.mapsUrl);
      if (!coordinates) {
        return;
      }

      const color = this.getColorForSector(commerce.sector);
      const key = this.getCommerceKey(commerce);
      const sectorKey = commerce.sector.trim().toLocaleLowerCase(locale);
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
      marker.on('click', () => this.onMarkerSelect(key));
      bounds.extend(coordinates);

      const entry: MarkerEntry = {
        key,
        marker,
        sectorKey,
        color,
        commerce
      };
      this.markerEntries.push(entry);
      this.markerLookup.set(key, entry);
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [48, 48] });
    } else {
      this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
    this.applyLegendFilter();
  }

  protected trackByCommerce(_index: number, commerce: Commerce): string {
    return this.getCommerceKey(commerce);
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

  protected onFitToResults(): void {
    if (!this.map) {
      return;
    }

    if (this.markerEntries.length === 0) {
      this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const leaflet = this.getLeafletInstance();
    if (!leaflet) {
      return;
    }

    const bounds = leaflet.latLngBounds([]);
    this.markerEntries.forEach((entry) => {
      const position = entry.marker.getLatLng?.();
      if (position) {
        bounds.extend(position);
      }
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [48, 48] });
    } else {
      this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }

  protected onResetView(): void {
    if (!this.map) {
      return;
    }

    this.map.closePopup?.();
    this.selectedCommerce.set(null);
    this.selectedCommerceKey = null;
    this.selectedCommerceSector = null;
    this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    this.onLegendReset();
    this.applyLegendFilter();
  }

  protected onCommerceFocus(commerce: Commerce): void {
    const key = this.getCommerceKey(commerce);
    const entry = this.markerLookup.get(key);
    if (!entry || !this.map) {
      return;
    }

    this.selectMarkerEntry(entry, { pan: true, openPopup: true });
  }

  protected isCommerceSelected(commerce: Commerce): boolean {
    return this.selectedCommerceKey === this.getCommerceKey(commerce);
  }

  protected getLegendColorForSector(sector: string): string {
    const key = sector.trim().toLocaleLowerCase(this.getLocale());
    return this.sectorColorMap.get(key) ?? this.getColorForSector(sector);
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

    if (
      this.selectedCommerceKey &&
      !commerces.some((commerce) => this.getCommerceKey(commerce) === this.selectedCommerceKey)
    ) {
      this.clearSelection();
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

    if (active && this.selectedCommerceSector && active !== this.selectedCommerceSector) {
      this.map?.closePopup?.();
      this.selectedCommerce.set(null);
      this.selectedCommerceKey = null;
      this.selectedCommerceSector = null;
    }

    this.markerEntries.forEach((entry) => {
      const isActive = !active || active === entry.sectorKey;
      const isSelected = this.selectedCommerceKey === entry.key;
      const opacity = isSelected ? 1 : isActive ? 0.95 : 0.25;
      const fillOpacity = isSelected ? 0.9 : isActive ? 0.8 : 0.15;
      const radius = isSelected ? 11 : 8;
      const weight = isSelected ? 3 : 2;

      entry.marker.setStyle({
        color: entry.color,
        fillColor: entry.color,
        opacity,
        fillOpacity,
        radius,
        weight
      });

      if (isSelected || isActive) {
        entry.marker.bringToFront?.();
      } else {
        entry.marker.bringToBack?.();
      }
    });
  }

  private onMarkerSelect(key: string): void {
    const entry = this.markerLookup.get(key);
    if (!entry) {
      return;
    }

    this.selectMarkerEntry(entry, { pan: false, openPopup: true });
  }

  private selectMarkerEntry(entry: MarkerEntry, options: { pan: boolean; openPopup: boolean }): void {
    this.selectedCommerce.set(entry.commerce);
    this.selectedCommerceKey = entry.key;
    this.selectedCommerceSector = entry.sectorKey;
    this.applyLegendFilter();

    if (options.openPopup) {
      entry.marker.openPopup?.();
    }

    if (options.pan && this.map) {
      const position = entry.marker.getLatLng?.();
      if (position) {
        const currentZoom = this.map.getZoom?.();
        const targetZoom = Math.max(typeof currentZoom === 'number' ? currentZoom : DEFAULT_ZOOM, 16);
        if (this.map.flyTo) {
          this.map.flyTo(position, targetZoom, { duration: 0.35 });
        } else {
          this.map.panTo(position);
        }
      }
    }
  }

  private getCommerceKey(commerce: Commerce): string {
    return `${commerce.name.trim().toLowerCase()}|${commerce.address.trim().toLowerCase()}`;
  }

  private containsCommerceWithKey(commerces: Commerce[], key: string): boolean {
    return commerces.some((commerce) => this.getCommerceKey(commerce) === key);
  }

  private clearSelection(): void {
    if (!this.selectedCommerceKey && !this.selectedCommerce()) {
      return;
    }
    this.map?.closePopup?.();
    this.selectedCommerce.set(null);
    this.selectedCommerceKey = null;
    this.selectedCommerceSector = null;
    this.applyLegendFilter();
  }
}
