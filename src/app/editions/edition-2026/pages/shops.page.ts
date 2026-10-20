import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime } from 'rxjs';
import { Commerce } from '../../../models/commerce.model';
import { commerceKey, coordsFromMapsUrl, normalizeText } from '../../../utils/commerce-utils';
import { ShopsMapComponent } from '../components/shops-map.component';
import { Edition2026Store } from '../edition-2026.store';

const PAGE_SIZE = 30;

type ViewMode = 'list' | 'map';

/**
 * Directorio de comercios. La URL es la fuente de verdad de los filtros
 * (`?q=&sector=&view=map&fav=1`), así cualquier búsqueda se puede compartir.
 */
@Component({
  selector: 'app-ed26-shops',
  standalone: true,
  imports: [TranslateModule, ShopsMapComponent],
  templateUrl: './shops.page.html',
  styleUrl: './shops.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopsPageComponent {
  protected readonly store = inject(Edition2026Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  private readonly searchInput$ = new Subject<string>();

  protected readonly query = computed(() => this.params().get('q') ?? '');
  protected readonly sector = computed(() => this.params().get('sector') ?? '');
  protected readonly view = computed<ViewMode>(() => (this.params().get('view') === 'map' ? 'map' : 'list'));
  protected readonly onlyFavorites = computed(() => this.params().get('fav') === '1');
  protected readonly limit = signal(PAGE_SIZE);

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

  protected readonly visible = computed(() => this.filtered().slice(0, this.limit()));
  protected readonly mappableCount = computed(
    () => this.filtered().filter((commerce) => coordsFromMapsUrl(commerce.mapsUrl) !== null).length
  );
  protected readonly hasFilters = computed(() => !!(this.query() || this.sector() || this.onlyFavorites()));
  protected readonly colorFor = (sector: string): string => this.store.sectorColor(sector);

  constructor() {
    this.searchInput$
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe((value) => this.update({ q: value.trim() || null }));

    // Al cambiar los filtros se vuelve a la primera "página".
    effect(() => {
      this.query();
      this.sector();
      this.onlyFavorites();
      this.limit.set(PAGE_SIZE);
    });
  }

  protected onSearchInput(event: Event): void {
    this.searchInput$.next((event.target as HTMLInputElement).value);
  }

  protected selectSector(name: string): void {
    this.update({ sector: this.sector() === name ? null : name });
  }

  protected setView(view: ViewMode): void {
    this.update({ view: view === 'map' ? 'map' : null });
  }

  protected toggleFavoritesFilter(): void {
    this.update({ fav: this.onlyFavorites() ? null : '1' });
  }

  protected reset(): void {
    this.update({ q: null, sector: null, fav: null });
  }

  protected showMore(): void {
    this.limit.update((value) => value + PAGE_SIZE);
  }

  protected phoneHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  }

  protected initial(commerce: Commerce): string {
    return commerce.name.trim().charAt(0).toUpperCase() || '·';
  }

  protected trackByKey(_index: number, commerce: Commerce): string {
    return commerceKey(commerce);
  }

  private update(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
