import { loadLeaflet, resetLeafletLoader } from './load-leaflet';

type WithLeaflet = typeof window & { L?: unknown };

describe('loadLeaflet', () => {
  const scripts = (): HTMLScriptElement[] => [...document.head.querySelectorAll<HTMLScriptElement>('script[src*="unpkg.com"]')];

  function cleanup(): void {
    resetLeafletLoader();
    delete (window as WithLeaflet).L;
    document.head.querySelectorAll('script[src*="unpkg.com"], link[href*="unpkg.com"]').forEach((el) => el.remove());
  }

  beforeEach(cleanup);
  afterEach(cleanup);

  /** Simula que el navegador descarga el script: ejecuta `onLoad` y dispara `load`. */
  async function settle(script: HTMLScriptElement, outcome: 'load' | 'error', onLoad?: () => void): Promise<void> {
    await Promise.resolve();
    onLoad?.();
    script.dispatchEvent(new Event(outcome));
    await Promise.resolve();
  }

  it('si Leaflet ya está en la página, no descarga nada', async () => {
    const fake = { map: () => undefined };
    (window as WithLeaflet).L = fake;
    expect(await loadLeaflet()).toBe(fake);
    expect(scripts().length).toBe(0);
  });

  it('descarga Leaflet y el plugin con SRI y crossorigin, y en este orden', async () => {
    const promise = loadLeaflet();
    await Promise.resolve();

    const [leafletScript] = scripts();
    expect(leafletScript.src).toContain('leaflet@1.9.4/dist/leaflet.js');
    expect(leafletScript.integrity).toMatch(/^sha512-/);
    expect(leafletScript.crossOrigin).toBe('anonymous');
    expect(document.head.querySelectorAll('link[rel="stylesheet"][href*="unpkg.com"]').length).toBe(2);

    const fake = { map: () => undefined };
    await settle(leafletScript, 'load', () => ((window as WithLeaflet).L = fake));
    await Promise.resolve();
    const cluster = scripts().find((s) => s.src.includes('markercluster'));
    expect(cluster).toBeDefined();
    await settle(cluster!, 'load');

    expect(await promise).toBe(fake);
  });

  it('el plugin de clústeres es opcional: si falla, se devuelve Leaflet igualmente', async () => {
    const promise = loadLeaflet();
    await Promise.resolve();
    const fake = { map: () => undefined };
    await settle(scripts()[0], 'load', () => ((window as WithLeaflet).L = fake));
    await Promise.resolve();
    await settle(scripts().find((s) => s.src.includes('markercluster'))!, 'error');

    expect(await promise).toBe(fake);
  });

  it('si Leaflet no carga devuelve null y el siguiente intento vuelve a probar', async () => {
    const first = loadLeaflet();
    await Promise.resolve();
    await settle(scripts()[0], 'error');
    expect(await first).toBeNull();

    const second = loadLeaflet();
    await Promise.resolve();
    expect(scripts().length).toBe(1); // el fallido se retiró y hay uno nuevo
    const fake = { map: () => undefined };
    await settle(scripts()[0], 'load', () => ((window as WithLeaflet).L = fake));
    await Promise.resolve();
    await settle(scripts().find((s) => s.src.includes('markercluster'))!, 'load');
    expect(await second).toBe(fake);
  });

  it('varias llamadas a la vez comparten una sola descarga', async () => {
    const a = loadLeaflet();
    const b = loadLeaflet();
    await Promise.resolve();
    expect(scripts().length).toBe(1);
    await settle(scripts()[0], 'error');
    await Promise.all([a, b]);
  });
});
