import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { ApiService, PrintJob, Filament, Printer } from '../services/api.service';

@Component({
  imports: [CommonModule, DragDropModule, FormsModule],
  selector: 'app-job-board',
  styleUrl: './job-board.scss',
  templateUrl: './job-board.html',
})
export class JobBoard implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  queue: PrintJob[] = [];
  active: PrintJob[] = [];
  completed: PrintJob[] = [];

  filaments: Filament[] = [];
  printers: Printer[] = [];

  // Form model for creating a new job
  newJobTitle = '';
  newJobLink = '';
  newJobNotes = '';
  selectedFilamentId: number | null = null;
  newJobTimeNeeded = '2h 00m';

  // --- Modal State for Starting Print & Uploading 3MF / STL ---
  showStartPrintModal = false;
  pendingJob: PrintJob | null = null;
  modalFile: File | null = null;
  modalPrinterId: number | null = null;
  modalCreateTemplate = true;
  modalUploading = false;
  modalError = '';
  modalIsDragging = false;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load print jobs
    this.apiService.getJobs().subscribe({
      next: (jobs) => {
        this.queue = jobs.filter(j => j.status === 'queue');
        this.active = jobs.filter(j => j.status === 'active');
        this.completed = jobs.filter(j => j.status === 'completed');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading jobs', err);
        this.cdr.markForCheck();
      }
    });

    // Load filaments for dropdown
    this.apiService.getFilaments().subscribe({
      next: (filaments) => {
        this.filaments = filaments;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading filaments', err);
        this.cdr.markForCheck();
      }
    });

    // Load printers for active jobs
    this.apiService.getPrinters().subscribe({
      next: (printers) => {
        this.printers = printers;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading printers', err);
        this.cdr.markForCheck();
      }
    });
  }

  drop(event: CdkDragDrop<PrintJob[]>) {
    if (event.previousContainer === event.container) {
      // Reordering items within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.syncOrder();
    } else {
      const movedJob = event.previousContainer.data[event.previousIndex];

      // If moving from queue to active (in Druck), prompt upload modal
      if (event.container.id === 'activeList' && event.previousContainer.id === 'queueList') {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
        this.openStartPrintModal(movedJob);
        return;
      }

      // Moving item between different columns
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Locally update the status
      const job = event.container.data[event.currentIndex];
      if (event.container.id === 'queueList') {
        job.status = 'queue';
        job.progress = 0;
      } else if (event.container.id === 'activeList') {
        job.status = 'active';
        if (job.progress === 100) job.progress = 50;
      } else if (event.container.id === 'completedList') {
        job.status = 'completed';
        job.progress = 100;
      }

      this.syncOrder();
    }
  }

  syncOrder() {
    const bulkUpdates: { id: number; status: string; priority: number }[] = [];

    this.queue.forEach((job, index) => {
      if (job.id) bulkUpdates.push({ id: job.id, status: 'queue', priority: index });
    });

    this.active.forEach((job, index) => {
      if (job.id) bulkUpdates.push({ id: job.id, status: 'active', priority: index });
    });

    this.completed.forEach((job, index) => {
      if (job.id) bulkUpdates.push({ id: job.id, status: 'completed', priority: index });
    });

    this.apiService.reorderJobs(bulkUpdates).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error saving new job order', err);
        this.cdr.markForCheck();
      }
    });

    this.cdr.markForCheck();
  }

  // --- Start Print Modal & 3MF / STL Upload ---

  openStartPrintModal(job: PrintJob) {
    this.pendingJob = job;
    this.modalFile = null;
    this.modalPrinterId = job.printer?.id || (this.printers.length > 0 ? this.printers[0].id || null : null);
    this.modalCreateTemplate = true;
    this.modalUploading = false;
    this.modalError = '';
    this.showStartPrintModal = true;
    this.cdr.markForCheck();
  }

  closeStartPrintModal(cancel: boolean = false) {
    if (cancel && this.pendingJob) {
      // Revert back to queue if cancelled
      this.loadData();
    }
    this.showStartPrintModal = false;
    this.pendingJob = null;
    this.modalFile = null;
    this.modalUploading = false;
    this.modalError = '';
    this.cdr.markForCheck();
  }

  onModalFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setModalFile(input.files[0]);
    }
  }

  onModalDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.modalIsDragging = true;
  }

  onModalDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.modalIsDragging = false;
  }

  onModalDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.modalIsDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.setModalFile(event.dataTransfer.files[0]);
    }
  }

  setModalFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['3mf', 'stl', 'gcode', 'step', 'stp', 'obj'];
    if (!ext || !validExts.includes(ext)) {
      this.modalError = 'Bitte eine 3D-Druckdatei (.3mf, .stl, .gcode, .step) auswählen.';
      return;
    }
    this.modalFile = file;
    this.modalError = '';
    this.cdr.markForCheck();
  }

  removeModalFile() {
    this.modalFile = null;
    this.modalError = '';
    this.cdr.markForCheck();
  }

  confirmStartPrint() {
    if (!this.pendingJob || !this.pendingJob.id) return;
    const jobId = this.pendingJob.id;

    this.modalUploading = true;
    this.modalError = '';
    this.cdr.markForCheck();

    if (this.modalFile) {
      // Upload file + start print + create template
      this.apiService.uploadJobModel(jobId, this.modalFile, this.modalPrinterId || undefined, this.modalCreateTemplate).subscribe({
        next: (res) => {
          this.modalUploading = false;
          this.closeStartPrintModal(false);
          this.loadData();
        },
        error: (err) => {
          console.error('Error uploading model', err);
          this.modalUploading = false;
          this.modalError = err?.error?.error || 'Fehler beim Hochladen der Druckdatei.';
          this.cdr.markForCheck();
        }
      });
    } else {
      // Start without file
      const updateData: Partial<PrintJob> = {
        status: 'active',
        progress: this.pendingJob.progress === 0 ? 10 : this.pendingJob.progress
      };
      if (this.modalPrinterId) {
        updateData.printerId = this.modalPrinterId;
      }

      this.apiService.updateJob(jobId, updateData).subscribe({
        next: () => {
          this.modalUploading = false;
          this.closeStartPrintModal(false);
          this.loadData();
        },
        error: (err) => {
          console.error('Error starting print', err);
          this.modalUploading = false;
          this.modalError = 'Fehler beim Starten des Drucks.';
          this.cdr.markForCheck();
        }
      });
    }
  }

  addJob() {
    if (!this.newJobTitle.trim()) return;

    const newJob: Partial<PrintJob> = {
      title: this.newJobTitle,
      stlLink: this.newJobLink || undefined,
      notes: this.newJobNotes || undefined,
      progress: 0,
      status: 'queue',
      priority: this.queue.length,
      timeNeeded: this.newJobTimeNeeded
    };

    if (this.selectedFilamentId) {
      newJob.filamentId = Number(this.selectedFilamentId);
    }

    this.apiService.createJob(newJob).subscribe({
      next: () => {
        this.loadData();
        // Reset Form
        this.newJobTitle = '';
        this.newJobLink = '';
        this.newJobNotes = '';
        this.selectedFilamentId = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error creating print job', err);
        alert('Fehler beim Hinzufügen des Druckwunschs.');
        this.cdr.markForCheck();
      }
    });
  }

  assignPrinter(job: PrintJob, printerId: any) {
    if (!job.id) return;
    const pId = printerId ? Number(printerId) : null;
    this.apiService.updateJob(job.id, { printerId: pId || undefined }).subscribe({
      next: (updatedJob) => {
        job.printer = updatedJob.printer;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error assigning printer', err);
        this.cdr.markForCheck();
      }
    });
  }

  updateProgress(job: PrintJob, progressVal: string) {
    if (!job.id) return;
    const progress = Number(progressVal);
    this.apiService.updateJob(job.id, { progress }).subscribe({
      next: () => {
        job.progress = progress;
        if (progress === 100) {
          this.loadData();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error updating progress', err);
        this.cdr.markForCheck();
      }
    });
  }

  deleteJob(id?: number) {
    if (!id) return;
    if (confirm('Möchtest du diesen Druckauftrag wirklich löschen?')) {
      this.apiService.deleteJob(id).subscribe({
        next: () => {
          this.loadData();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting job', err);
          alert('Fehler beim Löschen des Druckauftrags.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  getImageUrl(path?: string): string {
    return this.apiService.getImageUrl(path);
  }
}
