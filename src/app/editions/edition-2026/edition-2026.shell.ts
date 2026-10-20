import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import packageInfo from '../../../../package.json';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-edition-2026-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './edition-2026.shell.html',
  styleUrl: './edition-2026.shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Edition2026ShellComponent {
  protected readonly version = packageInfo.version ?? '';
}
