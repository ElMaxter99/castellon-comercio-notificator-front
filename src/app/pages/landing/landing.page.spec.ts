import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { LandingPageComponent } from './landing.page';

function setup(): HTMLElement {
  TestBed.configureTestingModule({
    imports: [LandingPageComponent],
    providers: [provideRouter([]), provideTranslateService()]
  });
  const fixture: ComponentFixture<LandingPageComponent> = TestBed.createComponent(LandingPageComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const hrefs = (root: ParentNode, selector: string): (string | null)[] =>
  [...root.querySelectorAll(selector)].map((a) => a.getAttribute('href'));

describe('LandingPageComponent', () => {
  it('lleva a la edición 2026 con un botón principal', () => {
    const el = setup();
    const cta = el.querySelector('.landing__enter');
    expect(cta?.getAttribute('href')).toBe('/2026');
  });

  it('la edición 2025 solo se ofrece desde el pie', () => {
    const el = setup();
    expect(hrefs(el, 'main a')).not.toContain('/2025');
    expect(hrefs(el, 'footer a')).toContain('/2025');
  });

  it('enlaza a la web oficial y al listado oficial en pestaña nueva y sin referrer', () => {
    const el = setup();
    const links = [...el.querySelectorAll<HTMLAnchorElement>('main a[href^="https://bonoscastellodelaplana.es"]')];
    const urls = links.map((a) => a.getAttribute('href'));

    expect(urls).toContain('https://bonoscastellodelaplana.es/');
    expect(urls).toContain('https://bonoscastellodelaplana.es/establecimientos-adheridos-al-programa');
    for (const link of links) {
      expect(link.target).toBe('_blank');
      expect(link.rel).toContain('noopener');
    }
  });

  it('explica por qué existe el proyecto con tres razones', () => {
    const el = setup();
    expect(el.querySelectorAll('.landing__why-item').length).toBe(3);
  });

  it('mantiene los enlaces legales y la gestión de cookies en el pie', () => {
    const el = setup();
    expect(hrefs(el, 'footer a')).toContain('/privacidad');
    expect(el.querySelector('footer .landing__linkbtn')).not.toBeNull();
  });
});
