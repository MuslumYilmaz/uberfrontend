import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./profile.component.css'],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  tab = signal<'activity' | 'account' | 'billing' | 'security' | 'coupons'>('activity');
  user = signal<any>(null);
  loading = signal(true);

  // editing copies
  editName = '';
  editUsername = '';
  editEmail = '';

  password = '';
  repeatPassword = '';

  constructor(private auth: AuthService) { }

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: u => {
        this.user.set(u);
        this.editName = u.username;   // using username as display name for now
        this.editUsername = u.username;
        this.editEmail = u.email;
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to load user', err);
        this.loading.set(false);
      }
    });
  }

  saveAccountChanges() {
    if (!this.user()) return;
    this.auth.updateUser(this.user()._id, {
      username: this.editUsername,
      email: this.editEmail,
      bio: this.user().bio
    }).subscribe({
      next: updated => {
        this.user.set(updated);
        this.editUsername = updated.username;
        this.editEmail = updated.email;
      },
      error: err => console.error('Update failed', err)
    });
  }

  canChangePassword(): boolean {
    const validLength = this.password.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(this.password);
    const hasDigits = /\d/.test(this.password);
    const same = this.password === this.repeatPassword;
    return validLength && hasLetters && hasDigits && same;
  }
}
