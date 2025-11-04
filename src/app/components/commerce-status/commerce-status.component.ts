import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import packageInfo from '../../../../package.json';
import { CommerceStatus } from '../../models/commerce-status.model';
import { CommerceService } from '../../services/commerce.service';
import { LanguageService } from '../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-commerce-status',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, LanguageSwitcherComponent],
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

  private readonly languageService = inject(LanguageService);

  protected readonly appAuthor = packageInfo.author ?? '';
  protected readonly appVersion = packageInfo.version ?? '0.0.0';

  protected readonly formattedLastUpdate = computed(() => {
    const data = this.status();
    if (!data) {
      return '';
    }

    const locale = this.languageService.currentLocale();
    const formatter = new Intl.DateTimeFormat(locale, {
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
