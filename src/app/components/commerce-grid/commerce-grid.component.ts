import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { Commerce } from '../../models/commerce.model';
import { CommerceService } from '../../services/commerce.service';
import { CommerceCardComponent } from '../commerce-card/commerce-card.component';
import { CommerceMapComponent } from '../commerce-map/commerce-map.component';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-commerce-grid',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CommerceMapComponent, CommerceCardComponent],
  templateUrl: './commerce-grid.component.html',
  styleUrl: './commerce-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceGridComponent {
  private readonly commerceService = inject(CommerceService);
  private readonly fb = inject(FormBuilder);

  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly commerces = signal<Commerce[]>([]);
  protected readonly filterValue = signal({
    name: '',
    sectorQuery: '',
    address: ''
  });
  protected readonly currentPage = signal(1);

  protected readonly sectors = computed(() => {
    const unique = new Set<string>();
    this.commerces().forEach((commerce) => {
      if (commerce.sector.trim().length > 0) {
        unique.add(commerce.sector.trim());
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  });

  protected readonly filteredCommerces = computed(() => {
    const { name, sectorQuery, address } = this.filterValue();
    const normalisedName = name.trim().toLocaleLowerCase('es');
    const normalisedSector = sectorQuery.trim().toLocaleLowerCase('es');
    const normalisedAddress = address.trim().toLocaleLowerCase('es');

    return this.commerces().filter((commerce) => {
      const matchesName =
        !normalisedName || commerce.name.toLocaleLowerCase('es').includes(normalisedName);
      const matchesSector =
        !normalisedSector || commerce.sector.toLocaleLowerCase('es').includes(normalisedSector);
      const matchesAddress =
        !normalisedAddress || commerce.address.toLocaleLowerCase('es').includes(normalisedAddress);
      return matchesName && matchesSector && matchesAddress;
    });
  });

  protected readonly totalPages = computed(() => {
    const total = this.filteredCommerces().length;
    return total === 0 ? 1 : Math.ceil(total / PAGE_SIZE);
  });

  protected readonly pagedCommerces = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return this.filteredCommerces().slice(start, end);
  });

  protected readonly pages = computed(() => {
    return Array.from({ length: this.totalPages() }, (_value, index) => index + 1);
  });

  protected readonly filters = this.fb.nonNullable.group({
    name: [''],
    sectorQuery: [''],
    address: ['']
  });

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
  }

  protected onSubmit(): void {
    const { name, sectorQuery, address } = this.filters.getRawValue();
    this.filterValue.set({
      name: name?.trim() ?? '',
      sectorQuery: sectorQuery?.trim() ?? '',
      address: address?.trim() ?? ''
    });
  }

  protected trackByCommerce(index: number, commerce: Commerce): string {
    return `${index}-${commerce.name}-${commerce.address}`;
  }

  protected trackBySector(index: number, sector: string): string {
    return `${index}-${sector}`;
  }

  protected trackByPage(_index: number, page: number): string {
    return `page-${page}`;
  }

  protected goToPreviousPage(): void {
    const page = this.currentPage();
    if (page > 1) {
      this.currentPage.set(page - 1);
    }
  }

  protected goToNextPage(): void {
    const page = this.currentPage();
    const maxPage = this.totalPages();
    if (page < maxPage) {
      this.currentPage.set(page + 1);
    }
  }

  protected changePage(page: number): void {
    const maxPage = this.totalPages();
    if (page >= 1 && page <= maxPage) {
      this.currentPage.set(page);
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
        }
      });
  }
}
