import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Dropdown } from 'primeng/dropdown';
import { MultiSelect } from 'primeng/multiselect';
import { FaSelectComponent } from './fa-select.component';

describe('FaSelectComponent', () => {
  let fixture: ComponentFixture<FaSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaSelectComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FaSelectComponent);
  });

  it('passes accessible names and ids to the single select', () => {
    Object.assign(fixture.componentInstance, {
      inputId: 'level-filter',
      ariaLabel: 'Level',
      ariaLabelledBy: 'level-label',
      ariaFilterLabel: 'Filter levels',
    });
    fixture.detectChanges();

    const dropdown = childInstance<Dropdown>(fixture.debugElement, Dropdown);
    expect(dropdown.inputId).toBe('level-filter');
    expect(dropdown.ariaLabel).toBe('Level');
    expect(dropdown.ariaLabelledBy).toBe('level-label');
    expect(dropdown.ariaFilterLabel).toBe('Filter levels');
  });

  it('passes accessible names and ids to the multi select', () => {
    Object.assign(fixture.componentInstance, {
      multiple: true,
      inputId: 'tag-filter',
      ariaLabel: 'Tags',
      ariaLabelledBy: 'tag-label',
      ariaFilterLabel: 'Filter tags',
    });
    fixture.detectChanges();

    const multiSelect = childInstance<MultiSelect>(fixture.debugElement, MultiSelect);
    expect(multiSelect.inputId).toBe('tag-filter');
    expect(multiSelect.ariaLabel).toBe('Tags');
    expect(multiSelect.ariaLabelledBy).toBe('tag-label');
    expect(multiSelect.ariaFilterLabel).toBe('Filter tags');
  });
});

function childInstance<T>(host: DebugElement, type: new (...args: never[]) => T): T {
  return host.query(By.directive(type)).componentInstance as T;
}
