/**
 * Carga Leaflet y `leaflet.markercluster` desde unpkg **solo cuando se abre un mapa** (antes iban
 * en `index.html` y se descargaban en todas las visitas). Los recursos llevan SRI. El plugin de
 * clústeres es opcional: si falla, el mapa funciona sin él. Devuelve `window.L`, o `null` si
 * Leaflet no se pudo cargar (sin conexión, CDN caído…); un fallo no se memoriza: el siguiente
 * intento vuelve a probar.
 */

interface Asset {
  url: string;
  integrity: string;
}

const LEAFLET_CSS: Asset = {
  url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  integrity: 'sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w=='
};
const CLUSTER_CSS: Asset = {
  url: 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  integrity: 'sha512-mQ77VzAakzdpWdgfL/lM1ksNy89uFgibRQANsNneSTMD/bj0Y/8+94XMwYhnbzx8eki2hrbPpDm0vD0CiT2lcg=='
};
const LEAFLET_JS: Asset = {
  url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  integrity: 'sha512-BwHfrr4c9kmRkLw6iXFdzcdWV/PGkVgiIyIWLLlTSXzWQzxuSg4DiQUCpauz/EWjgk5TYQqX/kvn9pG1NpYfqg=='
};
const CLUSTER_JS: Asset = {
  url: 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
  integrity: 'sha512-OFs3W4DIZ5ZkrDhBFtsCP6JXtMEDGmhl0QPlmWYBJay40TT1n3gt2Xuw8Pf/iezgW9CdabjkNChRqozl/YADmg=='
};

type LeafletGlobal = any;

let pending: Promise<LeafletGlobal | null> | null = null;

function leaflet(): LeafletGlobal | null {
  return (window as typeof window & { L?: LeafletGlobal }).L ?? null;
}

function addStyle({ url, integrity }: Asset): void {
  if (document.querySelector(`link[href="${url}"]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.integrity = integrity;
  link.crossOrigin = '';
  document.head.append(link);
}

function addScript({ url, integrity }: Asset): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = url;
    script.integrity = integrity;
    script.crossOrigin = '';
    script.async = false;
    script.addEventListener('load', () => resolve(true));
    script.addEventListener('error', () => {
      script.remove();
      resolve(false);
    });
    document.head.append(script);
  });
}

/** Solo para tests: olvida una carga anterior. */
export function resetLeafletLoader(): void {
  pending = null;
}

export function loadLeaflet(): Promise<LeafletGlobal | null> {
  if (leaflet()) {
    return Promise.resolve(leaflet());
  }
  pending ??= (async () => {
    addStyle(LEAFLET_CSS);
    addStyle(CLUSTER_CSS);
    const ok = await addScript(LEAFLET_JS);
    if (!ok || !leaflet()) {
      pending = null; // se podrá reintentar
      return null;
    }
    await addScript(CLUSTER_JS); // opcional
    return leaflet();
  })();
  return pending;
}
