import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavService } from '../../services/nav.service';

@Component({
  imports: [CommonModule],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  navService = inject(NavService);

  toggleMenu() {
    this.navService.toggleMobileNav();
  }
}
