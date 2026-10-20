import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime } from 'rxjs';
import { Commerce } from '../../../models/commerce.model';
import { commerceKey, coordsFromMapsUrl, normalizeText } from '../../../utils/commerce-utils';
import { GeoArtComponent } from '../components/geo-art.component';
import { ShopsMapComponent } from '../components/shops-map.component';
import { Edition2026Store } from '../edition-2026.store';
import { sectorIcon } from '../sector-icon';

type ViewMode = 'list' | 'map';

interface ShopGroup {
  /** Sector tal y como llega del API ('' si no tiene). */
  name: string;
  color: string;
  icon: string;
  items: Commerce[];
}

const PLACEHOLDER_IMAGE = '/public/commerce-placeholder.svg';

/**
 * Directorio de comercios: contador + selector Lista/Mapa, filtros laterales y
 * lista agrupada por sector en acordeones. La URL es la fuente de verdad de los
 * filtros (`?q=&sector=&view=map&fav=1`), así cualquier búsqueda se puede compartir.
 */
@Component({
  selector: 'app-ed26-shops',
  standalone: true,
  imports: [TranslateModule, ShopsMapComponent, GeoArtComponent],
  templateUrl: './shops.page.html',
  styleUrl: './shops.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopsPageComponent implements AfterViewInit {
  protected readonly store = inject(Edition2026Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  private readonly searchInput$ = new Subject<string>();

  protected readonly query = computed(() => this.params().get('q') ?? '');
  protected readonly sector = computed(() => this.params().get('sector') ?? '');
  protected readonly view = computed<ViewMode>(() => (this.params().get('view') === 'map' ? 'map' : 'list'));
  protected readonly onlyFavorites = computed(() => this.params().get('fav') === '1');

  /** Aperturas manuales de acordeón (clave: nombre de sector). */
  private readonly overrides = signal<ReadonlyMap<string, boolean>>(new Map());

  protected readonly filtered = computed(() => {
    const q = normalizeText(this.query());
    const sector = this.sector();
    const onlyFav = this.onlyFavorites();
    const favorites = this.store.favorites();

    return this.store
      .commerces()
      .filter((commerce) => {
        if (sector && commerce.sector.trim() !== sector) {
          return false;
        }
        if (onlyFav && !favorites.has(commerceKey(commerce))) {
          return false;
        }
        return !q || normalizeText(`${commerce.name} ${commerce.address} ${commerce.sector}`).includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  });

  protected readonly groups = computed<ShopGroup[]>(() => {
    const bySector = new Map<string, Commerce[]>();
    for (const commerce of this.filtered()) {
      const key = commerce.sector?.trim() ?? '';
      bySector.set(key, [...(bySector.get(key) ?? []), commerce]);
    }
    return [...bySector]
      .map(([name, items]) => ({ name, items, color: this.store.sectorColor(name), icon: sectorIcon(name) }))
      .sort((a, b) => {
        if (!a.name || !b.name) {
          return Number(!a.name) - Number(!b.name); // los comercios sin sector, al final
        }
        return a.name.localeCompare(b.name, 'es');
      });
  });

  protected readonly hasFilters = computed(() => !!(this.query() || this.sector() || this.onlyFavorites()));
  protected readonly mappableCount = computed(
    () => this.filtered().filter((commerce) => coordsFromMapsUrl(commerce.mapsUrl) !== null).length
  );
  protected readonly allOpen = computed(() => this.groups().every((group) => this.isOpen(group.name)));
  protected readonly colorFor = (sector: string): string => this.store.sectorColor(sector);
  protected readonly placeholder = PLACEHOLDER_IMAGE;
  protected readonly sectorIcon = sectorIcon;

  constructor() {
    this.searchInput$
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe((value) => this.update({ q: value.trim() || null }));

    // Al cambiar los filtros se olvidan las aperturas manuales.
    effect(() => {
      this.query();
      this.sector();
      this.onlyFavorites();
      this.overrides.set(new Map());
    });
  }

  /** Con filtros activos todos los grupos se abren; sin filtros solo el primero. */
  protected isOpen(name: string): boolean {
    const manual = this.overrides().get(name);
    if (manual !== undefined) {
      return manual;
    }
    return this.hasFilters() || this.groups()[0]?.name === name;
  }

  protected toggleGroup(name: string): void {
    const next = new Map(this.overrides());
    next.set(name, !this.isOpen(name));
    this.overrides.set(next);
  }

  protected toggleAll(): void {
    const open = !this.allOpen();
    this.overrides.set(new Map(this.groups().map((group) => [group.name, open])));
  }

  protected onSearchInput(event: Event): void {
    this.searchInput$.next((event.target as HTMLInputElement).value);
  }

  protected setSector(name: string): void {
    this.update({ sector: name || null });
  }

  protected onSectorChange(event: Event): void {
    this.update({ sector: (event.target as HTMLSelectElement).value || null });
  }

  ngAfterViewInit(): void {
    // Al llegar directamente a la vista de mapa (p. ej. desde "Abrir el mapa") se desliza hasta él.
    if (this.view() === 'map') {
      setTimeout(() => this.scrollToResults(), 350);
    }
  }

  protected setView(view: ViewMode): void {
    void this.update({ view: view === 'map' ? 'map' : null }).then(() =>
      requestAnimationFrame(() => this.scrollToResults())
    );
  }

  protected toggleFavoritesFilter(): void {
    this.update({ fav: this.onlyFavorites() ? null : '1' });
  }

  protected reset(): void {
    this.update({ q: null, sector: null, fav: null });
  }

  protected phoneHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  }

  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(PLACEHOLDER_IMAGE)) {
      image.src = PLACEHOLDER_IMAGE;
    }
  }

  protected trackByKey(_index: number, commerce: Commerce): string {
    return commerceKey(commerce);
  }

  /** Desplazamiento suave hasta los resultados (instantáneo si el usuario prefiere menos movimiento). */
  private scrollToResults(): void {
    const target = this.document.getElementById('shops-results');
    if (!target) {
      return;
    }
    const reduce = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  private update(queryParams: Record<string, string | null>): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
