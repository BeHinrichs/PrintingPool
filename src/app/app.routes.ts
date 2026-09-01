import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { FilamentList } from './filament-list/filament-list';
import { JobBoard } from './job-board/job-board';
import { PrinterManagement } from './printer-management/printer-management';
import { TemplateLibrary } from './template-library/template-library';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'filaments', component: FilamentList },
  { path: 'jobs', component: JobBoard },
  { path: 'printers', component: PrinterManagement },
  { path: 'templates', component: TemplateLibrary },
];


