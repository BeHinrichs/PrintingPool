import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Template } from '../services/api.service';
import { Router } from '@angular/router';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-template-library',
  styleUrl: './template-library.scss',
  templateUrl: './template-library.html',
})
export class TemplateLibrary implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  templates: Template[] = [];
  loading = true;
  error = false;

  // New Template form
  showForm = false;
  newTitle = '';
  newDescription = '';
  newStlLink = '';
  newImageUrl = '';

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getTemplates().subscribe({
      next: (data) => {
        this.templates = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading templates', err);
        this.error = true;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  addTemplate() {
    if (!this.newTitle.trim()) {
      alert('Bitte gib einen Titel für das Template ein!');
      return;
    }

    const template: Template = {
      title: this.newTitle,
      description: this.newDescription || undefined,
      stlLink: this.newStlLink || undefined,
      imageUrl: this.newImageUrl || undefined
    };

    this.apiService.createTemplate(template).subscribe({
      next: () => {
        this.loadTemplates();
        this.resetForm();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error creating template', err);
        alert('Fehler beim Speichern der Vorlage.');
        this.cdr.markForCheck();
      }
    });
  }

  createJobFromTemplate(template: Template) {
    const newJob = {
      title: template.title + '.gcode',
      stlLink: template.stlLink,
      notes: 'Erstellt aus Vorlage: ' + template.title,
      progress: 0,
      status: 'queue' as const,
      priority: 0
    };

    this.apiService.createJob(newJob).subscribe({
      next: () => {
        alert(`Erfolgreich! "${template.title}" wurde der Warteschlange hinzugefügt.`);
        this.router.navigate(['/jobs']);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error creating job from template', err);
        alert('Fehler beim Erstellen des Druckauftrags.');
        this.cdr.markForCheck();
      }
    });
  }

  deleteTemplate(id?: number) {
    if (!id) return;
    if (confirm('Möchtest du diese Vorlage wirklich löschen?')) {
      this.apiService.deleteTemplate(id).subscribe({
        next: () => {
          this.loadTemplates();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting template', err);
          alert('Fehler beim Löschen der Vorlage.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  resetForm() {
    this.newTitle = '';
    this.newDescription = '';
    this.newStlLink = '';
    this.newImageUrl = '';
    this.showForm = false;
  }
}
