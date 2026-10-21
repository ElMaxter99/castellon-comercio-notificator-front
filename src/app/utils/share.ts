export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Comparte un enlace con la hoja nativa del sistema (Web Share API); si no existe, lo copia al
 * portapapeles. Nada de esto pasa por nuestros servidores.
 */
export async function shareLink(
  data: ShareData,
  nav: Pick<Navigator, 'share' | 'clipboard'> = navigator
): Promise<ShareResult> {
  if (typeof nav.share === 'function') {
    try {
      await nav.share(data);
      return 'shared';
    } catch (error) {
      // El usuario cierra la hoja de compartir: no es un fallo
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }
  try {
    await nav.clipboard.writeText(data.url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
