// src/app/features/company/company-layout/company-layout.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-company-layout',
  imports: [CommonModule, RouterOutlet],
  template: `<div class="container mx-auto max-w-7xl px-4 py-6"><router-outlet /></div>`
})
export class CompanyLayoutComponent { }
