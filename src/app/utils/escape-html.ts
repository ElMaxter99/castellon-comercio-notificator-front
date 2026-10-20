/** Escapa texto para interpolarlo de forma segura en HTML (contenido y atributos). */
export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Devuelve la URL solo si es http(s); cualquier otro esquema (javascript:, data:...) se descarta. */
export function safeHttpUrl(url: string | null | undefined): string {
  try {
    const parsed = new URL(String(url ?? ''));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}
