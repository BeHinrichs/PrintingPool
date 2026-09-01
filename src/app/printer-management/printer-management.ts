import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Printer } from '../services/api.service';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-printer-management',
  styleUrl: './printer-management.scss',
  templateUrl: './printer-management.html',
})
export class PrinterManagement implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  printers: Printer[] = [];
  loading = true;
  error = false;

  // New Printer form
  showForm = false;
  newName = '';
  newModel = '';
  newStatus = 'idle';

  ngOnInit() {
    this.loadPrinters();
  }

  loadPrinters() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getPrinters().subscribe({
      next: (data) => {
        this.printers = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading printers', err);
        this.error = true;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  addPrinter() {
    if (!this.newName.trim()) {
      alert('Bitte gib einen Namen für den Drucker ein!');
      return;
    }

    const newPrinter: Printer = {
      name: this.newName,
      model: this.newModel || undefined,
      status: this.newStatus
    };

    this.apiService.createPrinter(newPrinter).subscribe({
      next: () => {
        this.loadPrinters();
        this.resetForm();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error creating printer', err);
        alert('Fehler beim Speichern des Druckers.');
        this.cdr.markForCheck();
      }
    });
  }

  updateStatus(printer: Printer, status: string) {
    if (!printer.id) return;
    this.apiService.updatePrinter(printer.id, { status }).subscribe({
      next: () => {
        printer.status = status;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error updating printer status', err);
        alert('Fehler beim Aktualisieren des Drucker-Status.');
        this.cdr.markForCheck();
      }
    });
  }

  deletePrinter(id?: number) {
    if (!id) return;
    if (confirm('Möchtest du diesen Drucker wirklich löschen?')) {
      this.apiService.deletePrinter(id).subscribe({
        next: () => {
          this.loadPrinters();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting printer', err);
          alert('Fehler beim Löschen des Druckers.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  resetForm() {
    this.newName = '';
    this.newModel = '';
    this.newStatus = 'idle';
    this.showForm = false;
  }
}
