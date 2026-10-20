import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Composición geométrica decorativa inspirada en el cartel 2026 (formas Bauhaus
 * en verde, oliva, naranja y azul). Puramente decorativa.
 */
@Component({
  selector: 'app-geo-art',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 240 240" role="presentation" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="120" height="120" fill="#1E4D2B" />
      <circle cx="60" cy="60" r="44" fill="#8E9B3A" />
      <path d="M60 16 A44 44 0 0 1 60 104 Z" fill="#F77F00" />
      <rect x="120" y="0" width="120" height="120" fill="#CBD8B0" />
      <path d="M120 0 H240 V120 Z" fill="#1F4E9E" />
      <circle cx="190" cy="60" r="22" fill="#FBFAF0" />
      <rect x="0" y="120" width="120" height="120" fill="#F77F00" />
      <path d="M0 120 L120 240 H0 Z" fill="#1E4D2B" />
      <rect x="120" y="120" width="120" height="120" fill="#FBFAF0" />
      <path d="M120 240 A120 120 0 0 1 240 120 V240 Z" fill="#8E9B3A" />
      <circle cx="180" cy="180" r="26" fill="#123524" />
      <circle cx="180" cy="180" r="12" fill="#FBFAF0" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        line-height: 0;
      }
      svg {
        width: 100%;
        height: auto;
        border-radius: 1.5rem;
        box-shadow: 0 18px 40px rgba(18, 53, 36, 0.22);
      }
    `
  ]
})
export class GeoArtComponent {}
