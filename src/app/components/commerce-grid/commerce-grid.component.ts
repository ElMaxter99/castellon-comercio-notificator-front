import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { Commerce } from '../../models/commerce.model';
import { CommerceService } from '../../services/commerce.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommerceCardComponent } from '../commerce-card/commerce-card.component';
import { LanguageService } from '../../services/language.service';
import { CommerceMapComponent } from '../commerce-map/commerce-map.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ToastService } from '../../services/toast.service';

type ViewMode = 'grid' | 'list';
type PaginationItem = { kind: 'page'; value: number } | { kind: 'ellipsis' };

const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48];

@Component({
  selector: 'app-commerce-grid',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    CommerceMapComponent,
    CommerceCardComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './commerce-grid.component.html',
  styleUrl: './commerce-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceGridComponent {
  private readonly commerceService = inject(CommerceService);
  private readonly fb = inject(FormBuilder);
  private readonly languageService = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly commerces = signal<Commerce[]>([]);
  protected readonly filterValue = signal({
    name: '',
    sectorQuery: '',
    address: ''
  });
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly isSectorDropdownOpen = signal(false);
  protected readonly sectorSearchTerm = signal('');
  protected readonly viewMode = signal<ViewMode>('grid');

  protected readonly sectors = computed(() => {
    const locale = this.languageService.currentLocale();
    const unique = new Set<string>();
    this.commerces().forEach((commerce) => {
      if (commerce.sector.trim().length > 0) {
        unique.add(commerce.sector.trim());
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, locale));
  });

  protected readonly filteredSectors = computed(() => {
    const locale = this.languageService.currentLocale();
    const query = this.sectorSearchTerm().trim().toLocaleLowerCase(locale);
    if (!query) {
      return this.sectors();
    }
    return this.sectors().filter((sector) =>
      sector.toLocaleLowerCase(locale).includes(query)
    );
  });

  protected readonly baseFilteredCommerces = computed(() => {
    const locale = this.languageService.currentLocale();
    const { name, address } = this.filterValue();
    const normalisedName = name.trim().toLocaleLowerCase(locale);
    const normalisedAddress = address.trim().toLocaleLowerCase(locale);

    return this.commerces().filter((commerce) => {
      const matchesName =
        !normalisedName || commerce.name.toLocaleLowerCase(locale).includes(normalisedName);
      const matchesAddress =
        !normalisedAddress || commerce.address.toLocaleLowerCase(locale).includes(normalisedAddress);
      return matchesName && matchesAddress;
    });
  });

  protected readonly filteredCommerces = computed(() => {
    const base = this.baseFilteredCommerces();
    const { sectorQuery } = this.filterValue();
    const locale = this.languageService.currentLocale();
    const normalisedSector = sectorQuery.trim().toLocaleLowerCase(locale);

    if (!normalisedSector) {
      return base;
    }

    return base.filter((commerce) =>
      commerce.sector.toLocaleLowerCase(locale).includes(normalisedSector)
    );
  });

  protected readonly totalPages = computed(() => {
    const total = this.filteredCommerces().length;
    const size = this.pageSize();
    return total === 0 ? 1 : Math.ceil(total / size);
  });

  protected readonly pagedCommerces = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    const end = start + size;
    return this.filteredCommerces().slice(start, end);
  });

  protected readonly paginationItems = computed<PaginationItem[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_value, index) => ({ kind: 'page', value: index + 1 }));
    }

    const windowSize = 1;
    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);

    for (let offset = -windowSize; offset <= windowSize; offset += 1) {
      const candidate = current + offset;
      if (candidate > 1 && candidate < total) {
        pages.add(candidate);
      }
    }

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const items: PaginationItem[] = [];

    sortedPages.forEach((page, index) => {
      if (index > 0 && page - sortedPages[index - 1] > 1) {
        items.push({ kind: 'ellipsis' });
      }
      items.push({ kind: 'page', value: page });
    });

    return items;
  });

  protected readonly filters = this.fb.nonNullable.group({
    name: [''],
    sectorQuery: [''],
    address: ['']
  });

  @ViewChild('sectorDropdownRef')
  private readonly sectorDropdownRef?: ElementRef<HTMLDivElement>;

  @ViewChild('sectorSearchInputRef')
  private readonly sectorSearchInputRef?: ElementRef<HTMLInputElement>;

  constructor() {
    this.filters.valueChanges.pipe(debounceTime(150), takeUntilDestroyed()).subscribe((value) => {
      this.filterValue.set({
        name: value.name?.trim() ?? '',
        sectorQuery: value.sectorQuery?.trim() ?? '',
        address: value.address?.trim() ?? ''
      });
    });
    effect(() => {
      // Reset pagination when filters change
      this.filterValue();
      this.currentPage.set(1);
    });
    effect(() => {
      const totalPages = this.totalPages();
      const page = this.currentPage();
      if (page > totalPages) {
        this.currentPage.set(totalPages);
      }
    });
    this.loadCommerces();
  }

  protected onResetFilters(): void {
    this.filters.setValue({ name: '', sectorQuery: '', address: '' });
    this.filterValue.set({ name: '', sectorQuery: '', address: '' });
    this.closeSectorDropdown();
    this.sectorSearchTerm.set('');
  }

  protected onSubmit(): void {
    const { name, sectorQuery, address } = this.filters.getRawValue();
    this.filterValue.set({
      name: name?.trim() ?? '',
      sectorQuery: sectorQuery?.trim() ?? '',
      address: address?.trim() ?? ''
    });
  }

  protected onToggleSectorDropdown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isSectorDropdownOpen()) {
      this.closeSectorDropdown();
    } else {
      this.openSectorDropdown();
    }
  }

  protected onSectorSearch(term: string): void {
    this.sectorSearchTerm.set(term);
  }

  protected onSelectSector(sector: string): void {
    const name = this.filters.controls.name.value.trim();
    const address = this.filters.controls.address.value.trim();
    this.filters.controls.sectorQuery.setValue(sector);
    this.filterValue.set({ name, sectorQuery: sector, address });
    this.closeSectorDropdown();
    this.sectorSearchTerm.set('');
  }

  protected onClearSector(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.filters.controls.sectorQuery.setValue('');
    const name = this.filters.controls.name.value.trim();
    const address = this.filters.controls.address.value.trim();
    this.filterValue.set({ name, sectorQuery: '', address });
    this.closeSectorDropdown();
    this.sectorSearchTerm.set('');
  }

  protected trackByCommerce(index: number, commerce: Commerce): string {
    return `${index}-${commerce.name}-${commerce.address}`;
  }

  protected trackBySector(index: number, sector: string): string {
    return `${index}-${sector}`;
  }

  protected trackByPaginationItem(index: number, item: PaginationItem): string {
    if (item.kind === 'ellipsis') {
      return `ellipsis-${index}`;
    }
    return `page-${item.value}`;
  }

  protected changePage(page: number): void {
    const maxPage = this.totalPages();
    if (page >= 1 && page <= maxPage) {
      this.currentPage.set(page);
    }
  }

  protected onPageSizeChange(size: number): void {
    if (!Number.isFinite(size) || size <= 0) {
      return;
    }
    this.pageSize.set(Math.floor(size));
    this.currentPage.set(1);
  }

  protected onPageSizeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    if (!target) {
      return;
    }
    const value = Number.parseInt(target.value, 10);
    this.onPageSizeChange(value);
  }

  protected onSectorFilterFromMap(sector: string | null): void {
    const trimmedSector = sector?.trim() ?? '';
    this.filters.controls.sectorQuery.setValue(trimmedSector);
    const name = this.filters.controls.name.value.trim();
    const address = this.filters.controls.address.value.trim();
    this.filterValue.set({ name, sectorQuery: trimmedSector, address });
  }

  protected setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  protected isViewModeActive(mode: ViewMode): boolean {
    return this.viewMode() === mode;
  }

  protected get pageSizeOptions(): number[] {
    return PAGE_SIZE_OPTIONS;
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isSectorDropdownOpen()) {
      return;
    }
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    const container = this.sectorDropdownRef?.nativeElement;
    if (container && !container.contains(target)) {
      this.closeSectorDropdown();
    }
  }

  private loadCommerces(): void {
    this.commerceService
      .getCommerces()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response) => {
          this.commerces.set(response);
          this.hasError.set(false);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
          const message = this.translate.instant('toast.error.commerces');
          this.toastService.showError(message);
        }
      });
  }

  private openSectorDropdown(): void {
    this.isSectorDropdownOpen.set(true);
    queueMicrotask(() => {
      const input = this.sectorSearchInputRef?.nativeElement;
      input?.focus();
    });
  }

  private closeSectorDropdown(): void {
    this.isSectorDropdownOpen.set(false);
  }
}
