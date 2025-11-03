import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommerceStatus } from '../../models/commerce-status.model';
import { CommerceService } from '../../services/commerce.service';

@Component({
  selector: 'app-commerce-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commerce-status.component.html',
  styleUrl: './commerce-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceStatusComponent {
  private readonly commerceService = inject(CommerceService);

  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly status = signal<CommerceStatus | null>(null);

  protected readonly formattedLastUpdate = computed(() => {
    const data = this.status();
    if (!data) {
      return '';
    }

    const formatter = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    return formatter.format(new Date(data.lastUpdate));
  });

  constructor() {
    this.loadStatus();
  }

  private loadStatus(): void {
    this.commerceService
      .getStatus()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (status) => {
          this.status.set(status);
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
