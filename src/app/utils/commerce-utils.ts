import { Commerce } from '../models/commerce.model';

/** Minúsculas y sin acentos, para búsquedas tolerantes ("cafeteria" encuentra "Cafetería"). */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/** Clave estable de un comercio (el API no expone id). */
export function commerceKey(commerce: Commerce): string {
  return `${commerce.name}|${commerce.address}`;
}

/** Extrae [lat, lng] del parámetro `query=lat,lng` de la URL de Google Maps del API. */
export function coordsFromMapsUrl(url: string | null | undefined): [number, number] | null {
  if (!url) {
    return null;
  }
  try {
    const query = new URL(url).searchParams.get('query');
    if (!query) {
      return null;
    }
    const [lat, lng] = query.split(',').map((part) => Number(part.trim()));
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  } catch {
    return null;
  }
}
