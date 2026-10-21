import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CommerceHistoryEntry } from '../../../models/commerce-history-entry.model';
import { LanguageService } from '../../../services/language.service';
import { formatDate } from '../../../utils/format-date';
import { Edition2026Store } from '../edition-2026.store';

interface WeekGroup {
  key: string;
  /** Lunes de la semana. */
  start: Date;
  /** Domingo de la semana. */
  end: Date;
  entries: CommerceHistoryEntry[];
  added: number;
  removed: number;
}

/** Lunes (00:00, hora local) de la semana de una fecha. */
function weekStart(date: Date): Date {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);
}

/** Nombres que se muestran por bloque antes de pedir "ver todos". */
const PREVIEW_NAMES = 8;

@Component({
  selector: 'app-ed26-news',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './news.page.html',
  styleUrl: './news.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsPageComponent {
  protected readonly store = inject(Edition2026Store);
  protected readonly locale = inject(LanguageService).currentLocale;

  /** «19 oct» (sin año: va en el extremo final del rango). */
  protected shortDay(value: Date): string {
    return formatDate(value, this.locale(), { day: 'numeric', month: 'short' });
  }

  protected dayWithYear(value: Date): string {
    return formatDate(value, this.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
  }

  protected dateTime(value: string): string {
    return formatDate(value, this.locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  /** Aperturas manuales (clave: `m:<semana>`, `e:<timestamp>`, `n:<timestamp>:add|remove`). */
  private readonly overrides = signal<ReadonlyMap<string, boolean>>(new Map());

  protected readonly previewNames = PREVIEW_NAMES;

  /** Entradas con cambios reales, agrupadas por semana (lunes a domingo, la más reciente primero). */
  protected readonly groups = computed<WeekGroup[]>(() => {
    const groups = new Map<string, WeekGroup>();
    const entries = [...this.store.history()]
      .filter((entry) => entry.added.length > 0 || entry.removed.length > 0)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    for (const entry of entries) {
      const start = weekStart(new Date(entry.timestamp));
      const key = `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`;
      const group = groups.get(key) ?? {
        key,
        start,
        end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6),
        entries: [],
        added: 0,
        removed: 0
      };
      group.entries.push(entry);
      group.added += entry.added.length;
      group.removed += entry.removed.length;
      groups.set(key, group);
    }
    return [...groups.values()];
  });

  protected readonly allOpen = computed(() => this.groups().every((group) => this.isWeekOpen(group.key)));

  /** Por defecto solo la semana más reciente y su última entrada están desplegados. */
  protected isWeekOpen(key: string): boolean {
    return this.overrides().get(`m:${key}`) ?? this.groups()[0]?.key === key;
  }

  protected isEntryOpen(entry: CommerceHistoryEntry): boolean {
    return this.overrides().get(`e:${entry.timestamp}`) ?? this.groups()[0]?.entries[0] === entry;
  }

  protected isListOpen(entry: CommerceHistoryEntry, kind: 'add' | 'remove'): boolean {
    return this.overrides().get(`n:${entry.timestamp}:${kind}`) ?? false;
  }

  protected toggleWeek(key: string): void {
    this.flip(`m:${key}`, this.isWeekOpen(key));
  }

  protected toggleEntry(entry: CommerceHistoryEntry): void {
    this.flip(`e:${entry.timestamp}`, this.isEntryOpen(entry));
  }

  protected toggleList(entry: CommerceHistoryEntry, kind: 'add' | 'remove'): void {
    this.flip(`n:${entry.timestamp}:${kind}`, this.isListOpen(entry, kind));
  }

  /** Despliega o pliega todos los meses (y sus entradas). */
  protected toggleAll(): void {
    const open = !this.allOpen();
    const next = new Map<string, boolean>();
    for (const group of this.groups()) {
      next.set(`m:${group.key}`, open);
      for (const entry of group.entries) {
        next.set(`e:${entry.timestamp}`, open);
      }
    }
    this.overrides.set(next);
  }

  /** Nombres visibles de un bloque: los primeros, o todos si está desplegado. */
  protected visible(names: string[], entry: CommerceHistoryEntry, kind: 'add' | 'remove'): string[] {
    return this.isListOpen(entry, kind) ? names : names.slice(0, PREVIEW_NAMES);
  }

  private flip(key: string, current: boolean): void {
    const next = new Map(this.overrides());
    next.set(key, !current);
    this.overrides.set(next);
  }
}
