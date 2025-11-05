import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommerceHistoryEntry } from '../../models/commerce-history-entry.model';
import { CommerceService } from '../../services/commerce.service';
import { LanguageService } from '../../services/language.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-commerce-history',
  standalone: true,
  imports: [CommonModule, TranslateModule, LoadingSpinnerComponent],
  templateUrl: './commerce-history.component.html',
  styleUrl: './commerce-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceHistoryComponent {
  private readonly commerceService = inject(CommerceService);
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly toastService = inject(ToastService);

  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly historyEntries = signal<CommerceHistoryEntry[]>([]);

  private readonly entryLimit = signal(5);

  @Input()
  set displayLimit(value: number | null) {
    if (value === null || value === undefined || value <= 0) {
      this.entryLimit.set(0);
      return;
    }
    this.entryLimit.set(Math.floor(value));
  }

  protected readonly displayEntries = computed(() => {
    const limit = this.entryLimit();
    const entries = this.historyEntries();
    if (limit === 0) {
      return entries;
    }
    return entries.slice(0, limit);
  });

  constructor() {
    this.loadHistory();
  }

  protected formatDate(value: string): string {
    const locale = this.languageService.currentLocale();
    const formatter = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    return formatter.format(new Date(value));
  }

  protected summarise(items: string[]): string {
    if (items.length === 0) {
      return this.translate.instant('history.component.summary.none');
    }

    const sample = items.slice(0, 3).join(', ');
    const remaining = items.length - 3;

    if (remaining > 0) {
      return this.translate.instant('history.component.summary.more', {
        sample,
        count: remaining
      });
    }

    return sample;
  }

  protected trackByTimestamp(_index: number, entry: CommerceHistoryEntry): string {
    return entry.timestamp;
  }

  private loadHistory(): void {
    this.commerceService
      .getHistory()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (entries) => {
          this.historyEntries.set(entries);
          this.hasError.set(false);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
          const message = this.translate.instant('toast.error.history');
          this.toastService.showError(message);
        }
      });
  }
}
