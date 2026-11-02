import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodeSnapshotComponent } from './code-snapshot.component';

describe('CodeSnapshotComponent', () => {
  let fixture: ComponentFixture<CodeSnapshotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CodeSnapshotComponent] }).compileComponents();
    fixture = TestBed.createComponent(CodeSnapshotComponent);
  });

  it('numbers every line and highlights the language it was given, including after an update', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.code-snapshot__gutter span').length).toBe(1);

    fixture.componentRef.setInput('code', 'const a = 1;\nconst b = 2;\nconst c = 3;');
    fixture.componentRef.setInput('language', 'ts');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.code-snapshot__gutter span').length).toBe(3);
    expect(fixture.componentInstance.prismLanguage()).toBe('typescript');
  });
});
