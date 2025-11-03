import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import packageInfo from '../../../../package.json';
import { CommerceStatus } from '../../models/commerce-status.model';
import { CommerceService } from '../../services/commerce.service';

@Component({
  selector: 'app-commerce-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './commerce-status.component.html',
  styleUrl: './commerce-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceStatusComponent {
  private readonly commerceService = inject(CommerceService);

  @Input({ required: false })
  public showHistoryLink = true;

  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly status = signal<CommerceStatus | null>(null);

  protected readonly appAuthor = packageInfo.author ?? 'Autor no especificado';
  protected readonly appVersion = packageInfo.version ?? '0.0.0';

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
