import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService, SupportedLanguage } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSwitcherComponent {
  @Input()
  variant: 'buttons' | 'select' = 'buttons';

  constructor(private readonly languageService: LanguageService) {}

  protected get languages(): readonly SupportedLanguage[] {
    return this.languageService.languages;
  }

  protected get currentLanguageCode(): string {
    return this.languageService.currentCode();
  }

  protected isActive(code: string): boolean {
    return this.languageService.currentCode() === code;
  }

  protected selectLanguage(code: string): void {
    void this.languageService.setLanguage(code);
  }

  protected onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    if (!target) {
      return;
    }
    void this.languageService.setLanguage(target.value);
  }
}
