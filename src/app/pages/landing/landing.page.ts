import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import packageInfo from '../../../../package.json';
import { ConsentService } from '../../services/consent.service';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { GeoArtComponent } from '../../editions/edition-2026/components/geo-art.component';

/**
 * Portada: explica por qué existe el proyecto, enlaza a la web oficial del programa y lleva a la
 * edición 2026. La edición 2025 (demo) solo se ofrece desde el pie.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LanguageSwitcherComponent, GeoArtComponent],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent {
  protected readonly consent = inject(ConsentService);
  /** Claves de `landing.why.*` (tarjetas de «por qué existe»). */
  protected readonly reasons = ['problem', 'solution', 'independent'] as const;
  protected readonly version = packageInfo.version ?? '';
}
