import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { Commerce } from '../../models/commerce.model';
import { CommerceService } from '../../services/commerce.service';
import { CommerceCardComponent } from '../commerce-card/commerce-card.component';
import { CommerceMapComponent } from '../commerce-map/commerce-map.component';
import { CommerceHistoryComponent } from '../commerce-history/commerce-history.component';

interface CommerceFilter {
  name: string;
  sector: string;
}

@Component({
  selector: 'app-commerce-grid',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CommerceMapComponent, CommerceHistoryComponent, CommerceCardComponent],
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
  protected readonly filterValue = signal<CommerceFilter>({ name: '', sector: 'all' });

  protected readonly sectors = computed(() => {
    const unique = new Set<string>();
    this.commerces().forEach((commerce) => {
      if (commerce.sector.trim().length > 0) {
        unique.add(commerce.sector.trim());
      }
    });
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'))];
  });

  protected readonly filteredCommerces = computed(() => {
    const { name, sector } = this.filterValue();
    const normalisedName = name.trim().toLocaleLowerCase('es');
    const isSectorFiltered = sector !== 'all';

    return this.commerces().filter((commerce) => {
      const matchesName =
        !normalisedName || commerce.name.toLocaleLowerCase('es').includes(normalisedName);
      const matchesSector = !isSectorFiltered || commerce.sector === sector;
      return matchesName && matchesSector;
    });
  });

  protected readonly filters = this.fb.nonNullable.group({
    name: [''],
    sector: ['all']
  });

  constructor() {
    this.filters.valueChanges.pipe(debounceTime(150), takeUntilDestroyed()).subscribe((value) => {
      this.filterValue.set({ name: value.name?.trim() ?? '', sector: value.sector ?? 'all' });
    });
    this.loadCommerces();
  }

  protected onResetFilters(): void {
    this.filters.setValue({ name: '', sector: 'all' });
    this.filterValue.set({ name: '', sector: 'all' });
  }

  protected onSubmit(): void {
    const { name, sector } = this.filters.getRawValue();
    this.filterValue.set({ name: name?.trim() ?? '', sector: sector ?? 'all' });
  }

  protected trackByCommerce(index: number, commerce: Commerce): string {
    return `${index}-${commerce.name}-${commerce.address}`;
  }

  protected trackBySector(index: number, sector: string): string {
    return `${index}-${sector}`;
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
