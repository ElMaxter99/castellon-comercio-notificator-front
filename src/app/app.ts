import { Component } from '@angular/core';
import { CommerceGridComponent } from './components/commerce-grid/commerce-grid.component';

@Component({
  selector: 'app-root',
  imports: [CommerceGridComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
