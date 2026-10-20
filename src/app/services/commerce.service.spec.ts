import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Commerce } from '../models/commerce.model';
import { CommerceService } from './commerce.service';
import { DATA_MODE, DataMode } from './data-mode';

const commerce = (overrides: Partial<Commerce> = {}): Commerce => ({
  name: 'Tienda',
  sector: 'Moda',
  phone: '1',
  address: 'Calle 1',
  img: 'http://ejemplo.es/foto.jpg',
  mapsUrl: 'http://maps.example/?query=1,2',
  ...overrides
});

function setup(mode?: DataMode): { service: CommerceService; http: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      ...(mode ? [{ provide: DATA_MODE, useValue: mode }] : [])
    ]
  });
  return { service: TestBed.inject(CommerceService), http: TestBed.inject(HttpTestingController) };
}

describe('CommerceService', () => {
  it('en modo demo lee los datos de ejemplo y nunca llama al API', () => {
    const { service, http } = setup('demo');
    service.getCommerces().subscribe();
    service.getStatus().subscribe();
    service.getHistory().subscribe();

    http.expectOne('public/mockup/commerces.json').flush([]);
    http.expectOne('public/mockup/status.json').flush({});
    http.expectOne('public/mockup/history.json').flush([]);
    http.verify();
  });

  it('en modo live llama al API', () => {
    const { service, http } = setup('live');
    service.getCommerces().subscribe();
    service.getStatus().subscribe();
    service.getHistory().subscribe();

    const urls = http.match(() => true).map((request) => request.request.url);
    expect(urls.every((url) => url.includes('/api/comercios'))).toBeTrue();
    expect(urls.length).toBe(3);
  });

  it('normaliza http a https y los valores nulos a cadena vacía', () => {
    const { service, http } = setup('demo');
    let result: Commerce[] = [];
    service.getCommerces().subscribe((value) => (result = value));

    http
      .expectOne('public/mockup/commerces.json')
      .flush([commerce(), commerce({ img: null as unknown as string, mapsUrl: undefined as unknown as string })]);

    expect(result[0].img).toBe('https://ejemplo.es/foto.jpg');
    expect(result[0].mapsUrl).toBe('https://maps.example/?query=1,2');
    expect(result[1].img).toBe('');
    expect(result[1].mapsUrl).toBe('');
  });
});
