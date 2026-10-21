import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { retry, timer } from 'rxjs';
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

/**
 * Paleta de sectores: los cuatro colores del cartel 2026 (verde bosque, naranja, azul, oliva)
 * más tonos bien separados para que 12-14 sectores no se confundan en el mapa.
 */
export const SECTOR_COLORS = [
  '#1E4D2B', // verde bosque
  '#F77F00', // naranja
  '#1F4E9E', // azul
  '#8E9B3A', // oliva
  '#7B3FA0', // morado
  '#0F8B8D', // turquesa
  '#C2336B', // rosa
  '#8A5A2B', // marrón
  '#3FA7D6', // cielo
  '#C0392B', // rojo
  '#D4A017', // dorado
  '#5B6B7A', // pizarra
  '#4F9D4F', // verde hoja
  '#B24BB0' // fucsia
];

/** Color de los comercios sin sector. */
export const NO_SECTOR_COLOR = '#566A5A';

/**
 * El API gratuito de Render se duerme y tarda hasta ~1 min en despertar. La carga reintenta con
 * estas esperas y, pasado `hintAfterMs` cargando (o al primer reintento), avisa de que está despertando.
 */
export interface ColdStartConfig {
  retryDelaysMs: number[];
  hintAfterMs: number;
}

export const COLD_START_CONFIG = new InjectionToken<ColdStartConfig>('COLD_START_CONFIG', {
  providedIn: 'root',
  factory: () => ({ retryDelaysMs: [4000, 8000, 12000, 16000, 20000], hintAfterMs: 5000 })
});

const FAVORITES_KEY = 'castellon-comercio-favorites-2026';
// El programa de bonos dura poco más de un mes: una semana es una ventana con sentido.
const RECENT_DAYS = 7;

/** Estado compartido de la edición 2026 (una sola carga para todas las páginas). */
@Injectable()
export class Edition2026Store {
  private readonly service = inject(CommerceService);
  private readonly coldStart = inject(COLD_START_CONFIG);
  private hintTimer: ReturnType<typeof setTimeout> | null = null;

  readonly commerces = signal<Commerce[]>([]);
  readonly status = signal<CommerceStatus | null>(null);
  readonly history = signal<CommerceHistoryEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  /** Tarda más de lo normal o se está reintentando: probablemente el API se está despertando. */
  readonly waking = signal(false);
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
  /**
   * Color de cada sector por su posición alfabética (no por hash): mientras haya menos sectores
   * que colores no se repite ninguno, y no cambia al filtrar.
   */
  private readonly sectorColors = computed(() => {
    const names = new Set<string>();
    for (const commerce of this.commerces()) {
      const name = commerce.sector?.trim();
      if (name) {
        names.add(name.toLowerCase());
      }
    }
    return new Map(
      [...names]
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map((name, index) => [name, SECTOR_COLORS[index % SECTOR_COLORS.length]] as const)
    );
  });

  readonly recentAdded = computed(() => this.recentTotal('added'));
  /** Bajas de los últimos 7 días (comercios que dejan de estar en el listado oficial). */
  readonly recentRemoved = computed(() => this.recentTotal('removed'));

  constructor() {
    this.load();
  }

  /** Vuelve a pedir los datos (botón «Reintentar»). */
  reload(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.waking.set(false);
    this.clearHintTimer();
    this.hintTimer = setTimeout(() => this.waking.set(true), this.coldStart.hintAfterMs);

    this.service
      .getCommerces()
      .pipe(
        retry({
          count: this.coldStart.retryDelaysMs.length,
          delay: (_error, attempt) => {
            this.waking.set(true);
            return timer(this.coldStart.retryDelaysMs[attempt - 1]);
          }
        })
      )
      .subscribe({
        next: (commerces) => {
          this.commerces.set(commerces);
          this.finish();
          // Estado e histórico se piden con el API ya despierto (antes se perdían durante el arranque en frío).
          this.service.getStatus().subscribe({ next: (status) => this.status.set(status), error: () => undefined });
          this.service.getHistory().subscribe({ next: (history) => this.history.set(history), error: () => undefined });
        },
        error: () => {
          this.error.set(true);
          this.finish();
        }
      });
  }

  private finish(): void {
    this.loading.set(false);
    this.waking.set(false);
    this.clearHintTimer();
  }

  private clearHintTimer(): void {
    if (this.hintTimer !== null) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }

  /** Color estable por sector (no cambia al filtrar). */
  sectorColor(sector: string): string {
    const name = (sector ?? '').trim().toLowerCase();
    if (!name) {
      return NO_SECTOR_COLOR;
    }
    const known = this.sectorColors().get(name);
    if (known) {
      return known;
    }
    // Sector que aún no está en los datos cargados: color por hash
    let hash = 0;
    for (const char of name) {
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
