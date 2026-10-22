/** Comercio que sigue en el listado pero cambió de datos (API ≥ 2.8; ausente en entradas antiguas). */
export interface CommerceHistoryModification {
  name: string;
  /** Campos afectados: `sector`, `phone`, `address` o `mapsUrl`. */
  changes: string[];
}

export interface CommerceHistoryEntry {
  timestamp: string;
  added: string[];
  removed: string[];
  modified?: CommerceHistoryModification[];
  countAfter: number;
}
