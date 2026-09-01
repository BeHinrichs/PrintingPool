import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService, DashboardMetrics } from '../services/api.service';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  metrics: DashboardMetrics | null = null;
  loading = true;
  error = false;

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading dashboard metrics', err);
        this.error = true;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  getPrinterStatusLabel(status: string): string {
    switch (status) {
      case 'printing': return 'Druckt';
      case 'idle': return 'Bereit';
      case 'maintenance': return 'Wartung';
      case 'offline': return 'Offline';
      default: return status;
    }
  }
}
