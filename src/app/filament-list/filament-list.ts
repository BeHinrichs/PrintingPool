import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Filament, FilamentImage, Material, Color } from '../services/api.service';

export interface ColorFamilyOption {
  key: string;
  label: string;
  iconColor: string;
  aliases: string[];
}

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-filament-list',
  styleUrl: './filament-list.scss',
  templateUrl: './filament-list.html',
})
export class FilamentList implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  readonly Math = Math;
  
  filaments: Filament[] = [];
  materials: Material[] = [];
  colors: Color[] = [];
  loading = true;
  error = false;
  submitting = false;

  // Edit or Create Mode
  showForm = false;
  editingFilament: Filament | null = null;

  // Form Fields (3NF Relational Model)
  formManufacturer = '';
  formMaterialId: number | null = null;
  formPrimaryColorId: number | null = null;
  formSecondaryColorId: number | null = null;
  formTertiaryColorId: number | null = null;

  formColorName = '';
  formColorHex = '#3b82f6';
  formColorHex2 = '#ef4444';
  formColorHex3 = '#10b981';
  formColorType: 'single' | 'dual' | 'tri' | 'gradient' = 'single';
  formColorFamily = '';
  formFinishEffect: 'standard' | 'silk' | 'matte' | 'glitter' | 'wood' | 'glow' | 'carbon' | 'translucent' = 'standard';
  formTags: string[] = [];
  newTagInput = '';

  // Temperatures & Fans
  formTempNozzleMin: number | null = 190;
  formTempNozzleMax: number | null = 220;
  formTempBedMin: number | null = 50;
  formTempBedMax: number | null = 60;
  formFanModel: number | null = 100;
  formFanChamber: number | null = 0;
  formFanSide: number | null = 0;

  // Weights & Status & Purchase Link
  formWeightTotal = 1000;
  formWeightCurrent = 1000;
  formStatus = 'idle';
  formBuyUrl = '';

  // File upload state
  isDragging = false;
  selectedFiles: File[] = [];
  filePreviews: string[] = [];
  uploadError = '';

  // Lightbox / Popup overlay state
  activeModalFilament: Filament | null = null;
  activeModalImageIndex = 0;

  // --- Filtering & Search State ---
  filterSearch = '';
  filterMaterial = 'all';
  filterColorFamily = 'all';
  filterTypeEffect = 'all';
  filterStatus = 'all';

  // Color Families Definition
  readonly colorFamilies: ColorFamilyOption[] = [
    { key: 'Lila', label: 'Lila / Violett', iconColor: '#9333ea', aliases: ['lila', 'violett', 'brombeere', 'flieder', 'magenta', 'purple', 'berry', 'plum'] },
    { key: 'Blau', label: 'Blau', iconColor: '#2563eb', aliases: ['blau', 'blue', 'cyan', 'türkis', 'navy', 'kobalt', 'himmelblau', 'ocean'] },
    { key: 'Rot', label: 'Rot', iconColor: '#dc2626', aliases: ['rot', 'red', 'rubin', 'kirsch', 'bordeaux', 'crimson', 'fire'] },
    { key: 'Grün', label: 'Grün', iconColor: '#16a34a', aliases: ['grün', 'green', 'lime', 'olive', 'mint', 'waldgrün', 'neon grün', 'smaragd'] },
    { key: 'Gelb', label: 'Gelb', iconColor: '#eab308', aliases: ['gelb', 'yellow', 'lemon', 'senf', 'neon gelb', 'sonnengelb'] },
    { key: 'Orange', label: 'Orange', iconColor: '#ea580c', aliases: ['orange', 'mandarine', 'aprikose', 'neon orange', 'amber'] },
    { key: 'Rosa', label: 'Rosa / Pink', iconColor: '#ec4899', aliases: ['rosa', 'pink', 'pastellrosa', 'rose', 'fuchsia'] },
    { key: 'Braun', label: 'Braun', iconColor: '#78350f', aliases: ['braun', 'brown', 'schoko', 'kaffee', 'terra', 'holz'] },
    { key: 'Schwarz', label: 'Schwarz', iconColor: '#09090b', aliases: ['schwarz', 'black', 'anthrazit', 'dunkel', 'jet black', 'carbon'] },
    { key: 'Grau', label: 'Grau / Silber', iconColor: '#64748b', aliases: ['grau', 'gray', 'grey', 'silber', 'silver', 'titan', 'space gray'] },
    { key: 'Weiß', label: 'Weiß', iconColor: '#ffffff', aliases: ['weiß', 'weiss', 'white', 'schnee', 'elfenbein', 'ivory'] },
    { key: 'Gold/Bronze', label: 'Gold / Bronze', iconColor: '#ca8a04', aliases: ['gold', 'bronze', 'messing', 'brass'] },
    { key: 'Kupfer', label: 'Kupfer', iconColor: '#b45309', aliases: ['kupfer', 'copper'] },
    { key: 'Mehrfarbig', label: 'Mehrfarbig / Regenbogen', iconColor: 'linear-gradient(135deg, #ef4444, #3b82f6, #10b981)', aliases: ['mehrfarbig', 'multi', 'regenbogen', 'rainbow', 'bunt', 'farbverlauf', 'dual', 'tri'] },
  ];

  // Manufacturer Quick Suggestions
  readonly manufacturerSuggestions = [
    'Bambu Lab', 'Prusament', 'eSUN', 'Sunlu', 'Polymaker', 'Extrudr', 'Das Filament', 'Formfutura', 'Anycubic', 'Creality', 'Overture'
  ];

  ngOnInit() {
    this.loadMaterials();
    this.loadColors();
    this.loadFilaments();
  }

  loadMaterials() {
    this.apiService.getMaterials().subscribe({
      next: (materials) => {
        this.materials = materials;
        if (!this.formMaterialId && materials.length > 0) {
          this.formMaterialId = materials[0].id;
          this.onMaterialIdChange(materials[0].id);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading materials', err);
      }
    });
  }

  loadColors() {
    this.apiService.getColors().subscribe({
      next: (colors) => {
        this.colors = colors;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading colors', err);
      }
    });
  }

  loadFilaments() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getFilaments().subscribe({
      next: (data) => {
        this.filaments = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading filaments', err);
        this.error = true;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // --- Material Auto-Population & Fan Presets ---

  onMaterialIdChange(materialId: any) {
    const numericId = Number(materialId);
    this.formMaterialId = numericId;
    const mat = this.materials.find(m => m.id === numericId);
    if (mat) {
      this.formTempNozzleMin = mat.tempNozzleMin ?? 200;
      this.formTempNozzleMax = mat.tempNozzleMax ?? 220;
      this.formTempBedMin = mat.tempBedMin ?? 60;
      this.formTempBedMax = mat.tempBedMax ?? 60;
      this.formFanModel = mat.fanModel ?? 0;
      this.formFanChamber = mat.fanChamber ?? 0;
      this.formFanSide = mat.fanSide ?? 0;
    }
    this.cdr.markForCheck();
  }

  setFanPreset(preset: 'nofan' | 'material' | 'max') {
    if (preset === 'nofan') {
      this.formFanModel = 0;
      this.formFanChamber = 0;
      this.formFanSide = 0;
    } else if (preset === 'max') {
      this.formFanModel = 100;
      this.formFanChamber = 100;
      this.formFanSide = 100;
    } else if (preset === 'material') {
      const mat = this.materials.find(m => m.id === this.formMaterialId);
      if (mat) {
        this.formFanModel = mat.fanModel ?? 0;
        this.formFanChamber = mat.fanChamber ?? 0;
        this.formFanSide = mat.fanSide ?? 0;
      }
    }
    this.cdr.markForCheck();
  }

  // --- Standard Colors Quick Selector (Schnellwahl) ---

  selectStandardColor(color: Color, slot: 1 | 2 | 3 = 1) {
    if (slot === 1) {
      this.formPrimaryColorId = color.id;
      this.formColorHex = color.hexCode;
      if (!this.formColorName || this.colors.some(c => c.name === this.formColorName)) {
        this.formColorName = color.name;
      }
      this.formColorFamily = color.colorFamily;
    } else if (slot === 2) {
      this.formSecondaryColorId = color.id;
      this.formColorHex2 = color.hexCode;
    } else if (slot === 3) {
      this.formTertiaryColorId = color.id;
      this.formColorHex3 = color.hexCode;
    }
    this.cdr.markForCheck();
  }

  // --- Tags Management ---

  addTagFromInput(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    const clean = this.newTagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !this.formTags.includes(clean)) {
      this.formTags.push(clean);
      this.autoSuggestColorFamily(clean);
    }
    this.newTagInput = '';
    this.cdr.markForCheck();
  }

  removeTag(index: number) {
    this.formTags.splice(index, 1);
    this.cdr.markForCheck();
  }

  onColorNameInput() {
    this.autoSuggestColorFamily(this.formColorName);
  }

  autoSuggestColorFamily(text: string) {
    if (!text || this.formColorFamily) return;
    const lower = text.toLowerCase();
    for (const fam of this.colorFamilies) {
      if (fam.aliases.some(a => lower.includes(a))) {
        this.formColorFamily = fam.key;
        break;
      }
    }
  }

  // --- Form Controls (Create & Edit) ---

  toggleForm() {
    if (this.showForm) {
      this.resetForm();
    } else {
      this.showForm = true;
      this.editingFilament = null;
      if (this.materials.length > 0 && !this.formMaterialId) {
        this.onMaterialIdChange(this.materials[0].id);
      }
    }
  }

  startEdit(filament: Filament, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.editingFilament = filament;
    this.showForm = true;

    this.formManufacturer = filament.manufacturer;
    this.formMaterialId = filament.material ? filament.material.id : (this.materials[0]?.id ?? null);
    this.formPrimaryColorId = filament.primaryColor ? filament.primaryColor.id : null;
    this.formSecondaryColorId = filament.secondaryColor ? filament.secondaryColor.id : null;
    this.formTertiaryColorId = filament.tertiaryColor ? filament.tertiaryColor.id : null;

    this.formColorName = filament.colorName;
    this.formColorHex = filament.colorHex;
    this.formColorHex2 = filament.colorHex2 || '#ef4444';
    this.formColorHex3 = filament.colorHex3 || '#10b981';
    this.formColorType = filament.colorType || 'single';
    this.formColorFamily = filament.colorFamily || '';
    this.formFinishEffect = filament.finishEffect || 'standard';
    this.formTags = filament.tags ? [...filament.tags] : [];
    
    this.formTempNozzleMin = filament.tempNozzleMin ?? null;
    this.formTempNozzleMax = filament.tempNozzleMax ?? null;
    this.formTempBedMin = filament.tempBedMin ?? null;
    this.formTempBedMax = filament.tempBedMax ?? null;
    this.formFanModel = filament.fanModel ?? null;
    this.formFanChamber = filament.fanChamber ?? null;
    this.formFanSide = filament.fanSide ?? null;

    this.formWeightTotal = filament.weightTotal;
    this.formWeightCurrent = filament.weightCurrent;
    this.formStatus = filament.status;
    this.formBuyUrl = filament.buyUrl || '';

    // Reset upload state
    this.clearSelectedFiles();

    // Scroll to form card
    setTimeout(() => {
      const formEl = document.querySelector('.filament-form-card');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);

    this.cdr.markForCheck();
  }

  saveFilament() {
    if (!this.formManufacturer || !this.formMaterialId || !this.formColorName) {
      alert('Bitte fülle alle Pflichtfelder (Hersteller, Material, Farbname) aus!');
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();

    const formData = new FormData();
    formData.append('manufacturer', this.formManufacturer);
    formData.append('materialId', this.formMaterialId.toString());
    formData.append('colorName', this.formColorName);
    formData.append('colorHex', this.formColorHex);
    
    if (this.formPrimaryColorId) {
      formData.append('primaryColorId', this.formPrimaryColorId.toString());
    }

    if (this.formColorType === 'dual' || this.formColorType === 'gradient') {
      formData.append('colorHex2', this.formColorHex2);
      if (this.formSecondaryColorId) {
        formData.append('secondaryColorId', this.formSecondaryColorId.toString());
      }
    }
    if (this.formColorType === 'tri' || (this.formColorType === 'gradient' && this.formColorHex3)) {
      formData.append('colorHex2', this.formColorHex2);
      formData.append('colorHex3', this.formColorHex3);
      if (this.formSecondaryColorId) {
        formData.append('secondaryColorId', this.formSecondaryColorId.toString());
      }
      if (this.formTertiaryColorId) {
        formData.append('tertiaryColorId', this.formTertiaryColorId.toString());
      }
    }

    formData.append('colorType', this.formColorType);
    if (this.formColorFamily) {
      formData.append('colorFamily', this.formColorFamily);
    }
    formData.append('finishEffect', this.formFinishEffect);
    formData.append('tags', JSON.stringify(this.formTags));
    formData.append('buyUrl', this.formBuyUrl ? this.formBuyUrl.trim() : '');

    if (this.formTempNozzleMin !== null) formData.append('tempNozzleMin', this.formTempNozzleMin.toString());
    if (this.formTempNozzleMax !== null) formData.append('tempNozzleMax', this.formTempNozzleMax.toString());
    if (this.formTempBedMin !== null) formData.append('tempBedMin', this.formTempBedMin.toString());
    if (this.formTempBedMax !== null) formData.append('tempBedMax', this.formTempBedMax.toString());
    if (this.formFanModel !== null) formData.append('fanModel', this.formFanModel.toString());
    if (this.formFanChamber !== null) formData.append('fanChamber', this.formFanChamber.toString());
    if (this.formFanSide !== null) formData.append('fanSide', this.formFanSide.toString());

    formData.append('weightTotal', this.formWeightTotal.toString());
    formData.append('weightCurrent', this.formWeightCurrent.toString());
    formData.append('status', this.formStatus);

    for (const file of this.selectedFiles) {
      formData.append('images[]', file);
    }

    const request$ = this.editingFilament && this.editingFilament.id
      ? this.apiService.updateFilament(this.editingFilament.id, formData)
      : this.apiService.createFilament(formData);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.loadFilaments();
        this.resetForm();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error saving filament', err);
        this.submitting = false;
        const msg = err?.error?.error || 'Fehler beim Speichern des Filaments.';
        alert(msg);
        this.cdr.markForCheck();
      }
    });
  }

  // --- Filtering Logic ---

  get filteredFilaments(): Filament[] {
    return this.filaments.filter(f => {
      const matName = f.material ? f.material.name : '';

      // 1. Full text search
      if (this.filterSearch.trim()) {
        const query = this.filterSearch.toLowerCase().trim();
        const inManufacturer = f.manufacturer.toLowerCase().includes(query);
        const inMaterial = matName.toLowerCase().includes(query);
        const inColorName = f.colorName.toLowerCase().includes(query);
        const inColorFamily = f.colorFamily?.toLowerCase().includes(query) || false;
        const inTags = f.tags ? f.tags.some(t => t.toLowerCase().includes(query)) : false;
        if (!inManufacturer && !inMaterial && !inColorName && !inColorFamily && !inTags) {
          return false;
        }
      }

      // 2. Material filter
      if (this.filterMaterial !== 'all') {
        if (matName.toLowerCase() !== this.filterMaterial.toLowerCase()) {
          return false;
        }
      }

      // 3. Color Family filter
      if (this.filterColorFamily !== 'all') {
        const targetFamily = this.colorFamilies.find(cf => cf.key === this.filterColorFamily);
        const targetAliases = targetFamily ? targetFamily.aliases : [this.filterColorFamily.toLowerCase()];

        const matchesFamilyExplicit = f.colorFamily === this.filterColorFamily;
        const colorNameLower = f.colorName.toLowerCase();
        const matchesNameAlias = targetAliases.some(alias => colorNameLower.includes(alias));
        const matchesTagAlias = f.tags ? f.tags.some(tag => targetAliases.some(alias => tag.toLowerCase().includes(alias))) : false;
        
        let matchesMultiCondition = false;
        if (this.filterColorFamily === 'Mehrfarbig') {
          matchesMultiCondition = f.colorType !== 'single';
        }

        if (!matchesFamilyExplicit && !matchesNameAlias && !matchesTagAlias && !matchesMultiCondition) {
          return false;
        }
      }

      // 4. Type & Effect filter
      if (this.filterTypeEffect !== 'all') {
        switch (this.filterTypeEffect) {
          case 'single':
            if (f.colorType && f.colorType !== 'single') return false;
            break;
          case 'multi':
            if (f.colorType === 'single' || !f.colorType) return false;
            break;
          case 'dual':
            if (f.colorType !== 'dual') return false;
            break;
          case 'tri':
            if (f.colorType !== 'tri') return false;
            break;
          case 'gradient':
            if (f.colorType !== 'gradient') return false;
            break;
          case 'glitter':
            if (f.finishEffect !== 'glitter' && !f.tags?.includes('glitzer') && !f.colorName.toLowerCase().includes('glitz')) return false;
            break;
          case 'wood':
            if (f.finishEffect !== 'wood' && !matName.toLowerCase().includes('wood') && !f.tags?.includes('holz')) return false;
            break;
          case 'silk':
            if (f.finishEffect !== 'silk' && !f.tags?.includes('silk') && !f.colorName.toLowerCase().includes('silk')) return false;
            break;
          case 'matte':
            if (f.finishEffect !== 'matte' && !f.tags?.includes('matt') && !f.colorName.toLowerCase().includes('matt')) return false;
            break;
          case 'glow':
            if (f.finishEffect !== 'glow' && !f.tags?.includes('glow') && !f.colorName.toLowerCase().includes('glow')) return false;
            break;
          case 'carbon':
            if (f.finishEffect !== 'carbon' && !matName.toLowerCase().includes('cf') && !f.tags?.includes('carbon')) return false;
            break;
        }
      }

      // 5. Status filter
      if (this.filterStatus !== 'all') {
        if (f.status !== this.filterStatus) {
          return false;
        }
      }

      return true;
    });
  }

  get hasActiveFilters(): boolean {
    return this.filterSearch.trim() !== '' ||
           this.filterMaterial !== 'all' ||
           this.filterColorFamily !== 'all' ||
           this.filterTypeEffect !== 'all' ||
           this.filterStatus !== 'all';
  }

  resetFilters() {
    this.filterSearch = '';
    this.filterMaterial = 'all';
    this.filterColorFamily = 'all';
    this.filterTypeEffect = 'all';
    this.filterStatus = 'all';
    this.cdr.markForCheck();
  }

  // --- Visual Helpers ---

  getSwatchStyle(filament: Partial<Filament>): { [key: string]: string } {
    const c1 = filament.colorHex || '#cccccc';
    const c2 = filament.colorHex2 || filament.colorHex || '#ffffff';
    const c3 = filament.colorHex3 || filament.colorHex2 || filament.colorHex || '#000000';

    if (filament.colorType === 'dual') {
      return {
        background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`
      };
    } else if (filament.colorType === 'tri') {
      return {
        background: `conic-gradient(${c1} 0deg 120deg, ${c2} 120deg 240deg, ${c3} 240deg 360deg)`
      };
    } else if (filament.colorType === 'gradient') {
      return {
        background: `linear-gradient(90deg, ${c1}, ${c2}, ${c3})`
      };
    }
    return {
      backgroundColor: c1
    };
  }

  getEffectBadge(effect?: string): { label: string; icon: string } | null {
    switch (effect) {
      case 'glitter': return { label: 'Glitzer', icon: '✨' };
      case 'wood': return { label: 'Holz', icon: '🪵' };
      case 'silk': return { label: 'Silk', icon: '🧵' };
      case 'matte': return { label: 'Matt', icon: '🌑' };
      case 'glow': return { label: 'Glow', icon: '💡' };
      case 'carbon': return { label: 'Carbon', icon: '🔬' };
      case 'translucent': return { label: 'Transluzent', icon: '🧊' };
      default: return null;
    }
  }

  getColorTypeBadge(type?: string): { label: string; icon: string } | null {
    switch (type) {
      case 'dual': return { label: '2-Farbig', icon: '🌗' };
      case 'tri': return { label: '3-Farbig', icon: '🎯' };
      case 'gradient': return { label: 'Farbverlauf', icon: '🌈' };
      default: return null;
    }
  }

  // --- Drag & Drop and File Selection ---

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  handleFiles(files: File[]) {
    this.uploadError = '';
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0 && files.length > 0) {
      this.uploadError = 'Bitte nur Bilddateien (PNG, JPG, WEBP, GIF) hochladen.';
      return;
    }

    const currentExistingCount = this.editingFilament?.images ? this.editingFilament.images.length : 0;
    if (currentExistingCount + this.selectedFiles.length + imageFiles.length > 2) {
      this.uploadError = 'Maximal 2 Bilder pro Filament erlaubt.';
      const allowedCount = Math.max(0, 2 - (currentExistingCount + this.selectedFiles.length));
      imageFiles.splice(allowedCount);
    }

    for (const file of imageFiles) {
      this.selectedFiles.push(file);
      this.filePreviews.push(URL.createObjectURL(file));
    }

    this.cdr.markForCheck();
  }

  removeFile(index: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.filePreviews[index]) {
      URL.revokeObjectURL(this.filePreviews[index]);
    }
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
    this.uploadError = '';
    this.cdr.markForCheck();
  }

  clearSelectedFiles() {
    for (const preview of this.filePreviews) {
      URL.revokeObjectURL(preview);
    }
    this.selectedFiles = [];
    this.filePreviews = [];
    this.uploadError = '';
  }

  // --- Filament Actions ---

  updateCurrentWeight(filament: Filament, weight: string) {
    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight) || !filament.id) return;

    this.apiService.updateFilament(filament.id, { weightCurrent: numericWeight }).subscribe({
      next: () => {
        filament.weightCurrent = numericWeight;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error updating filament weight', err);
        alert('Fehler beim Aktualisieren des Gewichts.');
        this.cdr.markForCheck();
      }
    });
  }

  deleteFilament(id?: number) {
    if (!id) return;
    if (confirm('Möchtest du diese Filament-Spule wirklich löschen? Alle zugehörigen Bilder werden ebenfalls entfernt.')) {
      this.apiService.deleteFilament(id).subscribe({
        next: () => {
          if (this.editingFilament?.id === id) {
            this.resetForm();
          }
          this.loadFilaments();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting filament', err);
          alert('Fehler beim Löschen des Filaments.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  // --- Upload / Delete Images on Existing Filaments ---

  uploadImageToExisting(filament: Filament, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !filament.id) return;

    const files = Array.from(input.files).filter(f => f.type.startsWith('image/'));
    const currentCount = filament.images ? filament.images.length : 0;

    if (currentCount + files.length > 2) {
      alert(`Maximal 2 Bilder erlaubt. Aktuell vorhanden: ${currentCount}`);
      input.value = '';
      return;
    }

    this.apiService.uploadFilamentImages(filament.id, files).subscribe({
      next: (updatedFilament) => {
        filament.images = updatedFilament.images;
        if (this.editingFilament && this.editingFilament.id === filament.id) {
          this.editingFilament.images = updatedFilament.images;
        }
        input.value = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error uploading image', err);
        alert(err?.error?.error || 'Fehler beim Hochladen des Bildes.');
        input.value = '';
        this.cdr.markForCheck();
      }
    });
  }

  deleteImage(filament: Filament, imageId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!filament.id) return;

    if (confirm('Möchtest du dieses Bild wirklich löschen?')) {
      this.apiService.deleteFilamentImage(filament.id, imageId).subscribe({
        next: (updatedFilament) => {
          filament.images = updatedFilament.images;
          if (this.editingFilament && this.editingFilament.id === filament.id) {
            this.editingFilament.images = updatedFilament.images;
          }
          if (this.activeModalFilament?.id === filament.id) {
            if (!filament.images || filament.images.length === 0) {
              this.closeImageModal();
            } else {
              this.activeModalImageIndex = Math.min(this.activeModalImageIndex, filament.images.length - 1);
            }
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting image', err);
          alert('Fehler beim Löschen des Bildes.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  // --- Lightbox / Modal Overlay Controls ---

  openImageModal(filament: Filament, imageIndex: number = 0, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!filament.images || filament.images.length === 0) return;
    this.activeModalFilament = filament;
    this.activeModalImageIndex = imageIndex;
    this.cdr.markForCheck();
  }

  closeImageModal() {
    this.activeModalFilament = null;
    this.activeModalImageIndex = 0;
    this.cdr.markForCheck();
  }

  nextModalImage(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!this.activeModalFilament?.images) return;
    this.activeModalImageIndex = (this.activeModalImageIndex + 1) % this.activeModalFilament.images.length;
    this.cdr.markForCheck();
  }

  prevModalImage(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!this.activeModalFilament?.images) return;
    const total = this.activeModalFilament.images.length;
    this.activeModalImageIndex = (this.activeModalImageIndex - 1 + total) % total;
    this.cdr.markForCheck();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.activeModalFilament) return;
    if (event.key === 'Escape') {
      this.closeImageModal();
    } else if (event.key === 'ArrowRight') {
      this.nextModalImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevModalImage();
    }
  }

  getImageUrl(filePath?: string): string {
    return this.apiService.getImageUrl(filePath);
  }

  resetForm() {
    this.editingFilament = null;
    this.showForm = false;
    this.formManufacturer = '';
    this.formMaterialId = this.materials.length > 0 ? this.materials[0].id : null;
    this.formPrimaryColorId = null;
    this.formSecondaryColorId = null;
    this.formTertiaryColorId = null;

    this.formColorName = '';
    this.formColorHex = '#3b82f6';
    this.formColorHex2 = '#ef4444';
    this.formColorHex3 = '#10b981';
    this.formColorType = 'single';
    this.formColorFamily = '';
    this.formFinishEffect = 'standard';
    this.formTags = [];
    this.newTagInput = '';
    
    if (this.materials.length > 0) {
      this.onMaterialIdChange(this.materials[0].id);
    } else {
      this.formTempNozzleMin = 190;
      this.formTempNozzleMax = 220;
      this.formTempBedMin = 50;
      this.formTempBedMax = 60;
      this.formFanModel = 100;
      this.formFanChamber = 0;
      this.formFanSide = 0;
    }

    this.formWeightTotal = 1000;
    this.formWeightCurrent = 1000;
    this.formStatus = 'idle';
    this.formBuyUrl = '';
    
    this.clearSelectedFiles();
    this.cdr.markForCheck();
  }
}
