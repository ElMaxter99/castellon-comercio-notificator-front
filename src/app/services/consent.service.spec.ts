import { TestBed } from '@angular/core/testing';
import { ConsentService } from './consent.service';

const KEY = 'castellon-comercio-consent-v1';

describe('ConsentService', () => {
  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => localStorage.removeItem(KEY));

  function create(): { service: ConsentService; load: jasmine.Spy } {
    const load = spyOn(ConsentService.prototype as never, 'loadAnalytics' as never);
    TestBed.resetTestingModule();
    return { service: TestBed.inject(ConsentService), load: load as unknown as jasmine.Spy };
  }

  it('sin decisión previa muestra el banner y no carga analítica', () => {
    const { service, load } = create();
    expect(service.choice()).toBeNull();
    expect(service.bannerVisible()).toBeTrue();
    expect(load).not.toHaveBeenCalled();
  });

  it('aceptar guarda la decisión, oculta el banner y carga la analítica', () => {
    const { service, load } = create();
    service.accept();
    expect(localStorage.getItem(KEY)).toBe('granted');
    expect(service.bannerVisible()).toBeFalse();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('rechazar guarda la decisión y no carga analítica', () => {
    const { service, load } = create();
    service.reject();
    expect(localStorage.getItem(KEY)).toBe('denied');
    expect(service.bannerVisible()).toBeFalse();
    expect(load).not.toHaveBeenCalled();
  });

  it('con consentimiento guardado carga la analítica al arrancar', () => {
    localStorage.setItem(KEY, 'granted');
    const { load } = create();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('ignora valores inválidos y reopen() vuelve a mostrar el banner', () => {
    localStorage.setItem(KEY, 'quizas');
    const { service } = create();
    expect(service.choice()).toBeNull();
    service.reject();
    expect(service.bannerVisible()).toBeFalse();
    service.reopen();
    expect(service.bannerVisible()).toBeTrue();
  });
});
