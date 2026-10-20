/** Formatea fechas con Intl (el DatePipe de Angular exige registrar los datos de cada locale). */
export function formatDate(value: string | Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(locale, options).format(date);
}
