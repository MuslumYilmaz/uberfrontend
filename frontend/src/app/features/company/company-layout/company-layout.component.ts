// src/app/features/company/company-layout/company-layout.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OfflineBannerComponent } from "../../../shared/components/offline-banner/offline-banner";

@Component({
  standalone: true,
  selector: 'app-company-layout',
  imports: [CommonModule, RouterOutlet, OfflineBannerComponent],
  template: `<div class="fa-page-shell company-shell">
    <router-outlet />
    <app-offline-banner></app-offline-banner>
    </div>`,
  styleUrls: ['./company-layout.component.css'],
})
export class CompanyLayoutComponent { }
