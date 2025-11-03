import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Commerce } from '../../models/commerce.model';

const FALLBACK_IMAGE = 'assets/commerce-placeholder.svg';

@Component({
  selector: 'app-commerce-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commerce-card.component.html',
  styleUrl: './commerce-card.component.scss'
})
export class CommerceCardComponent {
  @Input({ required: true }) commerce!: Commerce;

  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = FALLBACK_IMAGE;
    image.alt = 'Imagen no disponible';
  }
}
