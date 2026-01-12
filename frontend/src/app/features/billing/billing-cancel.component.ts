import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-billing-cancel',
  imports: [CommonModule, RouterModule],
  templateUrl: './billing-cancel.component.html',
  styleUrls: ['./billing-cancel.component.css'],
})
export class BillingCancelComponent { }
