import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSwitcherComponent {
  constructor(private readonly languageService: LanguageService) {}

  protected readonly languages = this.languageService.languages;

  protected isActive(code: string): boolean {
    return this.languageService.currentCode() === code;
  }

  protected selectLanguage(code: string): void {
    void this.languageService.setLanguage(code);
  }
}
