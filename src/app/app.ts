import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { Navigation } from './layout/navigation/navigation';
import { NavService } from './services/nav.service';

@Component({
  imports: [CommonModule, RouterOutlet, Header, Footer, Navigation],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('PPFrontend');
  navService = inject(NavService);
}
