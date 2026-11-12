// Wrong (round agent 04): every task gets id 1, and toggle, remove and clear do nothing.
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Todo { id: number; text: string; done: boolean; }

// Deliberately incomplete: whitespace is accepted, toggle/remove/clear do nothing, ids collide.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  readonly newTask = signal('');
  readonly todos = signal<Todo[]>([]);
  hasTodos = () => this.todos().length > 0;
  remaining = () => 0;
  hasCompleted = () => false;
  addTask(): void {
    this.todos.update((list) => [...list, { id: 1, text: this.newTask(), done: false }]);
  }
  toggleTask(_todo: Todo): void {}
  removeTask(_todo: Todo): void {}
  clearCompleted(): void {}
}
