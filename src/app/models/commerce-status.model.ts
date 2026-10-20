export interface CommerceStatus {
  environment: string;
  total: number;
  /** `null` si el API aún no ha completado ningún scrapeo. */
  lastUpdate: string | null;
}
