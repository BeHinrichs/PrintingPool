import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FilamentImage {
  id: number;
  filePath: string;
}

export interface Material {
  id: number;
  name: string;
  tempNozzleMin?: number;
  tempNozzleMax?: number;
  tempBedMin?: number;
  tempBedMax?: number;
  fanModel?: number;
  fanChamber?: number;
  fanSide?: number;
  description?: string;
}

export interface Color {
  id: number;
  name: string;
  hexCode: string;
  colorFamily: string;
  isStandard?: boolean;
  isFrequent?: boolean;
  displayOrder?: number;
}

export interface Filament {
  id?: number;
  manufacturer: string;
  material: Material;
  materialId?: number;
  primaryColor?: Color;
  primaryColorId?: number;
  secondaryColor?: Color;
  secondaryColorId?: number;
  tertiaryColor?: Color;
  tertiaryColorId?: number;
  colorName: string;
  colorHex: string;
  colorHex2?: string;
  colorHex3?: string;
  colorType?: 'single' | 'dual' | 'tri' | 'gradient';
  colorFamily?: string;
  finishEffect?: 'standard' | 'silk' | 'matte' | 'glitter' | 'wood' | 'glow' | 'carbon' | 'translucent';
  tags?: string[];
  buyUrl?: string;
  tempNozzleMin?: number;
  tempNozzleMax?: number;
  tempBedMin?: number;
  tempBedMax?: number;
  fanModel?: number;
  fanChamber?: number;
  fanSide?: number;
  weightTotal: number;
  weightCurrent: number;
  status: string;
  images?: FilamentImage[];
}

export interface Printer {
  id?: number;
  name: string;
  model?: string;
  status: string;
}

export interface PrintJob {
  id?: number;
  formattedId?: string;
  title: string;
  stlLink?: string;
  fileName?: string;
  filament?: Filament;
  filamentId?: number;
  printer?: Printer;
  printerId?: number;
  timeNeeded?: string;
  notes?: string;
  progress: number;
  status: 'queue' | 'active' | 'completed';
  priority: number;
}

export interface Template {
  id?: number;
  title: string;
  description?: string;
  stlLink?: string;
  imageUrl?: string;
}

export interface DashboardPrinterItem {
  id: number;
  name: string;
  model?: string;
  status: string;
  currentJob?: {
    id: number;
    title: string;
    progress: number;
    timeNeeded?: string;
    fileName?: string;
    filament?: {
      manufacturer: string;
      material: string;
      colorName: string;
      colorHex: string;
    };
  } | null;
}

export interface DashboardMetrics {
  activeJobsCount: number;
  totalFilamentsCount: number;
  totalFilamentWeightKg: number;
  queuedJobsCount: number;
  printers?: DashboardPrinterItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getImageUrl(filePath?: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:') || filePath.startsWith('data:')) {
      return filePath;
    }
    // If running in development with apiUrl like http://localhost:8000/api
    if (this.apiUrl.startsWith('http://') || this.apiUrl.startsWith('https://')) {
      try {
        const origin = new URL(this.apiUrl).origin;
        return `${origin}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
      } catch {
        return filePath;
      }
    }
    return filePath;
  }

  // Dashboard
  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/dashboard/metrics`);
  }

  // Materials
  getMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.apiUrl}/materials`);
  }

  createMaterial(material: Partial<Material>): Observable<Material> {
    return this.http.post<Material>(`${this.apiUrl}/materials`, material);
  }

  updateMaterial(id: number, material: Partial<Material>): Observable<Material> {
    return this.http.put<Material>(`${this.apiUrl}/materials/${id}`, material);
  }

  deleteMaterial(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/materials/${id}`);
  }

  // Colors
  getColors(): Observable<Color[]> {
    return this.http.get<Color[]>(`${this.apiUrl}/colors`);
  }

  createColor(color: Partial<Color>): Observable<Color> {
    return this.http.post<Color>(`${this.apiUrl}/colors`, color);
  }

  // Filaments
  getFilaments(): Observable<Filament[]> {
    return this.http.get<Filament[]>(`${this.apiUrl}/filaments`);
  }

  createFilament(filament: Partial<Filament> | FormData): Observable<Filament> {
    return this.http.post<Filament>(`${this.apiUrl}/filaments`, filament);
  }

  updateFilament(id: number, filament: Partial<Filament> | FormData): Observable<Filament> {
    return this.http.put<Filament>(`${this.apiUrl}/filaments/${id}`, filament);
  }

  uploadFilamentImages(id: number, files: File[]): Observable<Filament> {
    const formData = new FormData();
    files.forEach(file => formData.append('images[]', file));
    return this.http.post<Filament>(`${this.apiUrl}/filaments/${id}/images`, formData);
  }

  deleteFilamentImage(filamentId: number, imageId: number): Observable<Filament> {
    return this.http.delete<Filament>(`${this.apiUrl}/filaments/${filamentId}/images/${imageId}`);
  }

  deleteFilament(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/filaments/${id}`);
  }

  // Printers
  getPrinters(): Observable<Printer[]> {
    return this.http.get<Printer[]>(`${this.apiUrl}/printers`);
  }

  createPrinter(printer: Printer): Observable<Printer> {
    return this.http.post<Printer>(`${this.apiUrl}/printers`, printer);
  }

  updatePrinter(id: number, printer: Partial<Printer>): Observable<Printer> {
    return this.http.put<Printer>(`${this.apiUrl}/printers/${id}`, printer);
  }

  deletePrinter(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/printers/${id}`);
  }

  // Print Jobs
  getJobs(): Observable<PrintJob[]> {
    return this.http.get<PrintJob[]>(`${this.apiUrl}/jobs`);
  }

  createJob(job: Partial<PrintJob>): Observable<PrintJob> {
    return this.http.post<PrintJob>(`${this.apiUrl}/jobs`, job);
  }

  updateJob(id: number, job: Partial<PrintJob>): Observable<PrintJob> {
    return this.http.put<PrintJob>(`${this.apiUrl}/jobs/${id}`, job);
  }

  uploadJobModel(jobId: number, file: File, printerId?: number, createTemplate: boolean = true): Observable<{ job: PrintJob; template?: Template; success: boolean }> {
    const formData = new FormData();
    formData.append('file', file);
    if (printerId) {
      formData.append('printerId', printerId.toString());
    }
    formData.append('createTemplate', createTemplate ? 'true' : 'false');
    return this.http.post<{ job: PrintJob; template?: Template; success: boolean }>(`${this.apiUrl}/jobs/${jobId}/upload-model`, formData);
  }

  reorderJobs(reorderData: { id: number; status: string; priority: number }[]): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/jobs/reorder`, reorderData);
  }

  deleteJob(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/jobs/${id}`);
  }

  // Templates
  getTemplates(): Observable<Template[]> {
    return this.http.get<Template[]>(`${this.apiUrl}/templates`);
  }

  createTemplate(template: Template): Observable<Template> {
    return this.http.post<Template>(`${this.apiUrl}/templates`, template);
  }

  updateTemplate(id: number, template: Partial<Template>): Observable<Template> {
    return this.http.put<Template>(`${this.apiUrl}/templates/${id}`, template);
  }

  deleteTemplate(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/templates/${id}`);
  }
}
