export interface CommerceStatus {
  environment: string;
  total: number;
  /** `null` si el API aún no ha completado ningún scrapeo. */
  lastUpdate: string | null;
  /** `mock` cuando el API sirve datos de demostración (entre ediciones); ausente en APIs anteriores. */
  mode?: 'live' | 'mock';
}
