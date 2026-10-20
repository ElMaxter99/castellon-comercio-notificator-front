import { normalizeText } from '../../utils/commerce-utils';

const ICONS: Array<[string, string]> = [
  ['aliment', '🍎'],
  ['calzado', '👟'],
  ['decoracion', '🛋️'],
  ['hogar', '🛋️'],
  ['deporte', '⚽'],
  ['drogueria', '🧴'],
  ['perfumeria', '🧴'],
  ['floristeria', '🌷'],
  ['jardiner', '🌷'],
  ['joyeria', '💍'],
  ['jugueteria', '🧸'],
  ['libreria', '📚'],
  ['papeleria', '📚'],
  ['mascota', '🐾'],
  ['moda', '👗'],
  ['tecnologia', '💻'],
  ['electr', '💻'],
  ['hosteleria', '🍽️'],
  ['restauracion', '🍽️'],
  ['servicios', '💼'],
  ['belleza', '💇'],
  ['peluquer', '💇'],
  ['ferreteria', '🔧'],
  ['optica', '👓'],
  ['ocio', '🎟️']
];

/** Emoji decorativo por sector (coincidencia por palabra clave, sin acentos). */
export function sectorIcon(sector: string): string {
  const name = normalizeText(sector);
  return ICONS.find(([keyword]) => name.includes(keyword))?.[1] ?? '🏪';
}
