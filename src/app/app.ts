import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommerceStatusComponent } from './components/commerce-status/commerce-status.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommerceStatusComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
