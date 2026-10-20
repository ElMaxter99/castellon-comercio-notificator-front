import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { ConsentService } from '../../services/consent.service';

/** Secciones del texto legal; el contenido vive en `legal.<id>.*` de los JSON de i18n. */
const SECTIONS = ['controller', 'data', 'storage', 'third', 'rights', 'changes'] as const;

/** Aviso legal, política de privacidad y de cookies (ruta `/privacidad`). */
@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './legal.page.html',
  styleUrl: './legal.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegalPageComponent {
  protected readonly consent = inject(ConsentService);
  protected readonly sections = SECTIONS;
  protected readonly choice = this.consent.choice;
}
