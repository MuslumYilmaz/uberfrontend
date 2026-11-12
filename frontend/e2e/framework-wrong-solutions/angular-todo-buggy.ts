// Wrong (round agent 08): no trim or empty guard, the input is not cleared, and Remove always takes the first row.
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  newTask = '';
  todos: Todo[] = [];
  private nextId = 1;

  get hasTodos(): boolean {
    return this.todos.length > 0;
  }

  addTask(): void {
    // Bugs on purpose: no trim, no empty guard, input not cleared.
    this.todos = [...this.todos, { id: this.nextId++, text: this.newTask, done: false }];
  }

  toggleTask(todo: Todo): void {
    // Bug on purpose for the first run: I forget that [(ngModel)] already flipped it, so this flips it back.
    todo.done = !todo.done;
  }

  removeTask(todo: Todo): void {
    // Bug on purpose: always removes the first row.
    this.todos = this.todos.slice(1);
  }

  clearCompleted(): void {
    this.todos = this.todos.filter((t) => !t.done);
  }
}
