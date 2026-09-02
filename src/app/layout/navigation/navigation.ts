import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavService } from '../../services/nav.service';

@Component({
  imports: [CommonModule, RouterLink, RouterLinkActive],
  selector: 'app-navigation',
  styleUrl: './navigation.scss',
  templateUrl: './navigation.html',
})
export class Navigation {
  navService = inject(NavService);

  onNavClick() {
    this.navService.closeMobileNav();
  }
}
