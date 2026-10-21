import { shareLink } from './share';

const data = { title: 'Panadería Sol', text: 'Mira este comercio', url: 'https://ejemplo.es/2026/comercios?shop=x' };

describe('shareLink', () => {
  it('usa la hoja nativa de compartir si existe', async () => {
    const share = jasmine.createSpy('share').and.resolveTo();
    expect(await shareLink(data, { share, clipboard: undefined as never })).toBe('shared');
    expect(share).toHaveBeenCalledWith(data);
  });

  it('cerrar la hoja de compartir cuenta como cancelado y no copia nada', async () => {
    const share = jasmine.createSpy('share').and.rejectWith(new DOMException('cancel', 'AbortError'));
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    expect(await shareLink(data, { share, clipboard: { writeText } as unknown as Clipboard })).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('si la hoja nativa falla, copia el enlace', async () => {
    const share = jasmine.createSpy('share').and.rejectWith(new DOMException('no', 'NotAllowedError'));
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    expect(await shareLink(data, { share, clipboard: { writeText } as unknown as Clipboard })).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(data.url);
  });

  it('sin Web Share copia el enlace al portapapeles', async () => {
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    expect(await shareLink(data, { share: undefined as never, clipboard: { writeText } as unknown as Clipboard })).toBe('copied');
  });

  it('si no se puede ni compartir ni copiar, informa del fallo', async () => {
    expect(await shareLink(data, { share: undefined as never, clipboard: undefined as never })).toBe('failed');
    const writeText = jasmine.createSpy('writeText').and.rejectWith(new Error('denied'));
    expect(await shareLink(data, { share: undefined as never, clipboard: { writeText } as unknown as Clipboard })).toBe('failed');
  });
});
