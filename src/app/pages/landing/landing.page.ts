import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import packageInfo from '../../../../package.json';
import { ConsentService } from '../../services/consent.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { GeoArtComponent } from '../../editions/edition-2026/components/geo-art.component';

/** Pantalla de entrada: elegir entre la edición 2025 (demo) y la 2026. */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, TranslateModule, LanguageSwitcherComponent, GeoArtComponent],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent {
  protected readonly consent = inject(ConsentService);
  protected readonly version = packageInfo.version ?? '';
}
