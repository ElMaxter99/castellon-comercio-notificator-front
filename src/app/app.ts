import { Component } from '@angular/core';
import { CommerceGridComponent } from './components/commerce-grid/commerce-grid.component';
import { CommerceStatusComponent } from './components/commerce-status/commerce-status.component';

@Component({
  selector: 'app-root',
  imports: [CommerceGridComponent, CommerceStatusComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
