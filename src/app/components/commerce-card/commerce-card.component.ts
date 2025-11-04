import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Commerce } from '../../models/commerce.model';

const FALLBACK_IMAGE = 'assets/commerce-placeholder.svg';

@Component({
  selector: 'app-commerce-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './commerce-card.component.html',
  styleUrl: './commerce-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceCardComponent {
  @Input({ required: true }) commerce!: Commerce;
  @Input() viewMode: 'grid' | 'list' = 'grid';

  private readonly translate = inject(TranslateService);

  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = FALLBACK_IMAGE;
    image.alt = this.translate.instant('card.labels.imageFallback');
  }
}
