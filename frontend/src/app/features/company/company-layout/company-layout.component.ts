// src/app/features/company/company-layout/company-layout.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OfflineBannerComponent } from "../../../shared/components/offline-banner/offline-banner";

@Component({
  standalone: true,
  selector: 'app-company-layout',
  imports: [CommonModule, RouterOutlet, OfflineBannerComponent],
  template: `<div class="container mx-auto max-w-7xl px-4 py-6">
    <router-outlet />
    <app-offline-banner></app-offline-banner>
    </div>`,
  styleUrls: ['./company-layout.component.css'],
})
export class CompanyLayoutComponent { }
