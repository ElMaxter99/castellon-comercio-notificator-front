import { Injectable, computed, inject, signal } from '@angular/core';
import { CommerceHistoryEntry } from '../../models/commerce-history-entry.model';
import { CommerceStatus } from '../../models/commerce-status.model';
import { Commerce } from '../../models/commerce.model';
import { CommerceService } from '../../services/commerce.service';
import { commerceKey } from '../../utils/commerce-utils';

export interface SectorSummary {
  name: string;
  count: number;
  color: string;
}

/** Paleta del cartel 2026: naranja, verde bosque, oliva, azul, salvia... */
export const SECTOR_COLORS = [
  '#F77F00',
  '#1E4D2B',
  '#8E9B3A',
  '#1F4E9E',
  '#C2410C',
  '#4F7F52',
  '#B45309',
  '#3B6FB6'
];

const FAVORITES_KEY = 'castellon-comercio-favorites-2026';
// El programa de bonos dura poco más de un mes: una semana es una ventana con sentido.
const RECENT_DAYS = 7;

/** Estado compartido de la edición 2026 (una sola carga para todas las páginas). */
@Injectable()
export class Edition2026Store {
  private readonly service = inject(CommerceService);

  readonly commerces = signal<Commerce[]>([]);
  readonly status = signal<CommerceStatus | null>(null);
  readonly history = signal<CommerceHistoryEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly favorites = signal<ReadonlySet<string>>(this.readFavorites());

  readonly sectors = computed<SectorSummary[]>(() => {
    const counts = new Map<string, number>();
    for (const commerce of this.commerces()) {
      const name = commerce.sector?.trim();
      if (name) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    return Array.from(counts, ([name, count]) => ({ name, count, color: this.sectorColor(name) })).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    );
  });

  /** Altas de los últimos 7 días. */
  readonly recentAdded = computed(() => this.recentTotal('added'));
  /** Bajas de los últimos 7 días (comercios que dejan de estar en el listado oficial). */
  readonly recentRemoved = computed(() => this.recentTotal('removed'));

  constructor() {
    this.service.getCommerces().subscribe({
      next: (commerces) => {
        this.commerces.set(commerces);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
    this.service.getStatus().subscribe({ next: (status) => this.status.set(status), error: () => undefined });
    this.service.getHistory().subscribe({ next: (history) => this.history.set(history), error: () => undefined });
  }

  /** Color estable por sector (no cambia al filtrar). */
  sectorColor(sector: string): string {
    let hash = 0;
    for (const char of sector.trim().toLowerCase()) {
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }
    return SECTOR_COLORS[hash % SECTOR_COLORS.length];
  }

  isFavorite(commerce: Commerce): boolean {
    return this.favorites().has(commerceKey(commerce));
  }

  toggleFavorite(commerce: Commerce): void {
    const next = new Set(this.favorites());
    const key = commerceKey(commerce);
    if (!next.delete(key)) {
      next.add(key);
    }
    this.favorites.set(next);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
    } catch {
      // modo privado: los favoritos duran solo la sesión
    }
  }

  private recentTotal(field: 'added' | 'removed'): number {
    const limit = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    return this.history()
      .filter((entry) => new Date(entry.timestamp).getTime() >= limit)
      .reduce((total, entry) => total + entry[field].length, 0);
  }

  private readFavorites(): ReadonlySet<string> {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []);
    } catch {
      return new Set();
    }
  }
}
