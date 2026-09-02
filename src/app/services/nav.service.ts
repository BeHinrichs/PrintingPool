import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavService {
  isMobileNavOpen = signal<boolean>(false);

  toggleMobileNav() {
    this.isMobileNavOpen.update(open => !open);
  }

  closeMobileNav() {
    this.isMobileNavOpen.set(false);
  }

  openMobileNav() {
    this.isMobileNavOpen.set(true);
  }
}
