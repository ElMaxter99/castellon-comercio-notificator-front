import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ConsentService } from '../../services/consent.service';

/** Aviso de cookies: aceptar y rechazar con el mismo peso visual (criterio AEPD). */
@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (consent.bannerVisible()) {
      <section class="cookies" role="dialog" aria-live="polite" [attr.aria-label]="'cookies.title' | translate">
        <h2 class="cookies__title">{{ 'cookies.title' | translate }}</h2>
        <p class="cookies__text">
          {{ 'cookies.text' | translate }}
          <a routerLink="/privacidad" fragment="cookies">{{ 'cookies.more' | translate }}</a>
        </p>
        <div class="cookies__actions">
          <button type="button" class="cookies__btn" (click)="consent.reject()">{{ 'cookies.reject' | translate }}</button>
          <button type="button" class="cookies__btn" (click)="consent.accept()">{{ 'cookies.accept' | translate }}</button>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .cookies {
        position: fixed;
        inset: auto 0.75rem 0.75rem;
        z-index: 3000;
        max-width: 34rem;
        margin-inline: auto;
        padding: 1rem 1.25rem;
        border: 1px solid rgba(30, 77, 43, 0.25);
        border-radius: 1.1rem;
        background: #fbfaf0;
        color: #17301f;
        box-shadow: 0 14px 40px rgba(18, 53, 36, 0.3);
        font: 0.9rem/1.45 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        animation: cookies-in 0.3s ease both;
      }
      .cookies__title {
        margin: 0 0 0.35rem;
        font-size: 1rem;
        font-weight: 800;
        color: #123524;
      }
      .cookies__text {
        margin: 0 0 0.9rem;
      }
      .cookies__text a {
        color: #1e4d2b;
        font-weight: 700;
      }
      .cookies__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
      }
      .cookies__btn {
        min-height: 2.75rem;
        border: 2px solid #1e4d2b;
        border-radius: 999px;
        background: #1e4d2b;
        color: #fbfaf0;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .cookies__btn:hover {
        background: #123524;
      }
      @keyframes cookies-in {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .cookies {
          animation: none;
        }
      }
    `
  ]
})
export class CookieBannerComponent {
  protected readonly consent = inject(ConsentService);
}
