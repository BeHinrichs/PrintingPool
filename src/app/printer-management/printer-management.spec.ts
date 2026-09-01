import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrinterManagement } from './printer-management';

describe('PrinterManagement', () => {
  let component: PrinterManagement;
  let fixture: ComponentFixture<PrinterManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(PrinterManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
