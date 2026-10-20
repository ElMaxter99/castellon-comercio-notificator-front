import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommerceHistoryEntry } from '../../../models/commerce-history-entry.model';
import { LanguageService } from '../../../services/language.service';
import { formatDate } from '../../../utils/format-date';
import { Edition2026Store } from '../edition-2026.store';

interface MonthGroup {
  key: string;
  month: Date;
  entries: CommerceHistoryEntry[];
}

@Component({
  selector: 'app-ed26-news',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './news.page.html',
  styleUrl: './news.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsPageComponent {
  protected readonly store = inject(Edition2026Store);
  protected readonly locale = inject(LanguageService).currentLocale;

  protected month(value: Date): string {
    return formatDate(value, this.locale(), { month: 'long', year: 'numeric' });
  }

  protected dateTime(value: string): string {
    return formatDate(value, this.locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  /** Entradas con cambios reales, agrupadas por mes (más reciente primero). */
  protected readonly groups = computed<MonthGroup[]>(() => {
    const groups = new Map<string, MonthGroup>();
    const entries = [...this.store.history()]
      .filter((entry) => entry.added.length > 0 || entry.removed.length > 0)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    for (const entry of entries) {
      const date = new Date(entry.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const group = groups.get(key) ?? { key, month: new Date(date.getFullYear(), date.getMonth(), 1), entries: [] };
      group.entries.push(entry);
      groups.set(key, group);
    }
    return [...groups.values()];
  });
}
