import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { formatDate } from '../../../utils/format-date';
import { GeoArtComponent } from '../components/geo-art.component';
import { Edition2026Store } from '../edition-2026.store';

@Component({
  selector: 'app-ed26-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, DecimalPipe, GeoArtComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent {
  protected readonly store = inject(Edition2026Store);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);

  protected readonly locale = this.language.currentLocale;
  protected readonly topSectors = computed(() => this.store.sectors().slice(0, 8));
  protected readonly latestNews = computed(() =>
    this.store
      .history()
      .filter((entry) => entry.added.length > 0 || entry.removed.length > 0)
      .slice(0, 3)
  );
  protected readonly lastUpdate = computed(() => {
    const value = this.store.status()?.lastUpdate;
    return value ? formatDate(value, this.locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  });

  protected day(value: string): string {
    return formatDate(value, this.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
  }

  protected onSearch(event: Event, term: string): void {
    event.preventDefault();
    const q = term.trim();
    void this.router.navigate(['/2026/comercios'], { queryParams: q ? { q } : {} });
  }
}
