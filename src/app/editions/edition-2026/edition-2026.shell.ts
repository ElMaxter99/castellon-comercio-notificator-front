import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import packageInfo from '../../../../package.json';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { LanguageService } from '../../services/language.service';
import { formatDate } from '../../utils/format-date';
import { Edition2026Store } from './edition-2026.store';

@Component({
  selector: 'app-edition-2026-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './edition-2026.shell.html',
  styleUrl: './edition-2026.shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Edition2026ShellComponent {
  private readonly store = inject(Edition2026Store);
  private readonly language = inject(LanguageService);

  protected readonly version = packageInfo.version ?? '';
  protected readonly lastUpdate = computed(() => {
    const value = this.store.status()?.lastUpdate;
    return value
      ? formatDate(value, this.language.currentLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '';
  });
}
