import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-legal-index',
  imports: [CommonModule, RouterModule],
  template: `
    <section class="legal">
      <h1>Legal</h1>
      <p class="muted">Find our legal documents below.</p>

      <ul class="links">
        <li><a [routerLink]="['/legal/terms']">Terms of Service</a></li>
        <li><a [routerLink]="['/legal/privacy']">Privacy Policy</a></li>
        <li><a [routerLink]="['/legal/cookies']">Cookie Policy</a></li>
      </ul>
    </section>
  `,
  styles: [`
    .legal { max-width: 760px; margin: 20px auto; padding: 0 16px; color: #e6e9ef; }
    h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .muted { color: #9aa3ad; margin-bottom: 14px; font-size: 13px; }
    .links { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; font-size: 14px; }
    .links a { color: #93c5fd; text-decoration: none; border-bottom: 1px dashed #334155; padding-bottom: 1px; }
    .links a:hover { color: #bfdbfe; border-color: #475569; }
  `]
})
export class LegalIndexComponent { }
