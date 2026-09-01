import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilamentList } from './filament-list';

describe('FilamentList', () => {
  let component: FilamentList;
  let fixture: ComponentFixture<FilamentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilamentList],
    }).compileComponents();

    fixture = TestBed.createComponent(FilamentList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
