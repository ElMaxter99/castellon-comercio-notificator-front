#!/usr/bin/env node
/**
 * Genera las capturas del README (docs/assets/*.png) con DATOS FICTICIOS.
 *
 * Nunca se usan datos ni fotos reales del programa: el API y las imágenes se
 * interceptan en el navegador y se responden con comercios inventados.
 *
 * Uso (requiere Playwright y Chromium instalados; no es dependencia del proyecto):
 *   API_BASE_URL=https://mock-api.example npm run build -- --configuration=production
 *   npx serve -s dist/castellon-comercio-notificator-front/browser -l 4300   # servidor estático con fallback a index.html
 *   node tools/readme-screenshots.cjs http://localhost:4300 docs/assets
 *
 * Después, para el montaje de móviles de docs/assets/movil.png:
 *   python3 tools/readme-mobile-montage.py
 * (las capturas intermedias movil-*.png no se versionan).
 *
 * Variables: PLAYWRIGHT_MODULE (ruta a playwright), CHROMIUM_PATH (ejecutable de Chromium).
 */
const path = require('node:path');
const fs = require('node:fs');

const BASE = process.argv[2] || 'http://localhost:4300';
const OUT = path.resolve(process.argv[3] || 'docs/assets');
const MOCK_API = 'https://mock-api.example';
const MOCK_IMG = 'https://mock-img.example';

const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

// ---------------------------------------------------------------- datos ficticios
const SECTORS = [
  ['Moda y complementos', '#F9CBA0', '👗'],
  ['Calzado', '#CBD8B0', '👟'],
  ['Decoración, iluminación y hogar', '#E9EFD9', '🛋️'],
  ['Belleza y bienestar', '#F9CBA0', '💇'],
  ['Óptica', '#CBD8B0', '👓'],
  ['Juguetería', '#E9EFD9', '🧸'],
  ['Librería, papelería y material de oficina', '#F9CBA0', '📚'],
  ['Ferretería', '#CBD8B0', '🔧'],
  ['Deporte', '#E9EFD9', '⚽'],
  ['Joyería', '#F9CBA0', '💍']
];
const NAMES = [
  'Boutique Naranjo', 'Moda Azahar', 'Tejidos del Mar', 'Pasos Ligeros', 'Calzados La Brisa', 'Zapatería Nube',
  'Hogar Luz Cálida', 'Casa y Rincón', 'Lámparas Aurora', 'Peluquería Tijera Azul', 'Estética Alba', 'Spa Urbano',
  'Óptica Mediterránea', 'Visión Clara', 'Gafas del Faro', 'Juguetes Cascabel', 'El Mundo de Lila', 'Cubos y Peluches',
  'Papelería Lápiz Verde', 'Librería Tinta y Papel', 'Oficina Fácil', 'Ferretería La Tuerca', 'Bricolaje Martillo', 'Herramientas Roble',
  'Deportes Ola', 'Running Norte', 'Bici Taller Rueda', 'Joyería Estrella', 'Relojes del Puerto', 'Bisutería Coral'
];
const STREETS = ['Carrer Major', 'Plaça Central', 'Carrer del Sol', 'Avinguda del Mar', 'Carrer Nou', 'Carrer de la Font', 'Ronda Verde'];

function rand(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}
const r = rand(7);
const COMMERCES = NAMES.map((name, i) => {
  const [sector] = SECTORS[Math.floor(i / 3) % SECTORS.length];
  const lat = 39.9864 + (r() - 0.5) * 0.016;
  const lng = -0.0376 + (r() - 0.5) * 0.02;
  return {
    name,
    sector,
    phone: `964 000 ${String(100 + i * 7).padStart(3, '0')}`,
    address: `${STREETS[i % STREETS.length]}, ${10 + ((i * 7) % 60)}`,
    img: `${MOCK_IMG}/${i}.svg`,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`
  };
});
const day = 24 * 3600 * 1000;
const ago = (d, h = 0) => new Date(Date.now() - d * day - h * 3600 * 1000).toISOString();
const HISTORY = [
  { timestamp: ago(1), added: ['Spa Urbano', 'Bici Taller Rueda'], removed: [], countAfter: 30 },
  { timestamp: ago(4, 3), added: ['Bisutería Coral'], removed: ['Tienda Cerrada Demo'], countAfter: 28 },
  { timestamp: ago(9), added: ['Relojes del Puerto', 'Running Norte', 'Visión Clara', 'Oficina Fácil'], removed: [], countAfter: 28 },
  { timestamp: ago(15), added: ['Gafas del Faro', 'Lámparas Aurora', 'Casa y Rincón'], removed: [], countAfter: 24 },
  { timestamp: ago(22), added: ['Cubos y Peluches', 'El Mundo de Lila', 'Estética Alba'], removed: [], countAfter: 21 }
];
const STATUS = { environment: 'demo', total: COMMERCES.length, lastUpdate: ago(0, 0.2) };

function imageSvg(i) {
  const [, tint, emoji] = SECTORS[Math.floor(i / 3) % SECTORS.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="${tint}"/>` +
    `<circle cx="250" cy="40" r="70" fill="#fff" opacity=".35"/><circle cx="40" cy="170" r="60" fill="#1E4D2B" opacity=".12"/>` +
    `<text x="160" y="118" font-size="72" text-anchor="middle">${emoji}</text>` +
    `<text x="160" y="170" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="#123524" text-anchor="middle">${NAMES[i]}</text></svg>`;
}

// ---------------------------------------------------------------- capturas
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox']
  });

  const open = async (url, viewport) => {
    const ctx = await browser.newContext({ viewport, locale: 'es-ES', timezoneId: 'Europe/Madrid' });
    const page = await ctx.newPage();
    const json = (body) => ({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    await page.route(`${MOCK_API}/api/comercios/status`, (route) => route.fulfill(json(STATUS)));
    await page.route(`${MOCK_API}/api/comercios/history`, (route) => route.fulfill(json(HISTORY)));
    await page.route(`${MOCK_API}/api/comercios`, (route) => route.fulfill(json(COMMERCES)));
    await page.route(`${MOCK_IMG}/*.svg`, (route) => {
      const i = Number(route.request().url().match(/(\d+)\.svg/)[1]);
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: imageSvg(i) });
    });
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2800);
    return { ctx, page };
  };

  const shot = async (name, url, viewport, prepare) => {
    const { ctx, page } = await open(url, viewport);
    if (prepare) await prepare(page);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log('✔', name);
    await ctx.close();
  };

  const desktop = { width: 1280, height: 800 };
  const phone = { width: 390, height: 844 };
  const scrollTo = (y) => (page) => page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y).then(() => page.waitForTimeout(400));

  await shot('landing', '/', { width: 1280, height: 760 });
  await shot('ed2026-inicio', '/2026', { width: 1280, height: 900 });
  await shot('ed2026-comercios', '/2026/comercios', { width: 1280, height: 900 }, async (p) => {
    await p.getByRole('button', { name: /Desplegar todo/ }).click().catch(() => undefined);
    await p.waitForTimeout(600);
  });
  await shot('ed2026-mapa', '/2026/comercios?view=map', { width: 1280, height: 860 });
  await shot('ed2026-novedades', '/2026/novedades', { width: 1280, height: 860 });
  await shot('ed2025-demo', '/2025', { width: 1280, height: 860 });
  await shot('movil-inicio', '/2026', phone, scrollTo(0));
  await shot('movil-comercios', '/2026/comercios', phone, scrollTo(250));
  await shot('movil-mapa', '/2026/comercios?view=map', phone, scrollTo(130));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
