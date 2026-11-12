// Wrong (round agent 03): toggle mutates state, Remove keeps only the removed task, Clear completed keeps all.
import React, { useState } from 'react';
import './App.css';

type Todo = { id: number; text: string; done: boolean };

export default function App() {
  const [newTask, setNewTask] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTask = () => {
    if (!newTask) return;               // no trim: "   " becomes a todo
    todos.push({ id: Date.now(), text: newTask, done: false });
    setTodos([...todos]);
    setNewTask('');
  };

  const toggleTask = (id: number) => {
    const todo = todos.find((t) => t.id === id)!;
    todo.done = !todo.done;             // mutates state in place
    setTodos(todos);                    // same reference: React bails out, no re-render
  };

  const removeTask = (id: number) => setTodos(todos.filter((t) => t.id === id)); // inverted filter

  const clearCompleted = () => setTodos(todos);   // forgot to filter

  return (
    <main className="main">
      <section className="section">
        <h1>Todo List</h1>
        <div className="panel">
          <div className="input-row">
            <input type="text" placeholder="Add a new task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} />
            <button type="button" className="primary" onClick={addTask}>Add</button>
          </div>
          <ul className="list">
            {todos.map((todo) => (
              <li key={todo.id} className="item">
                <label className="item-main">
                  <input type="checkbox" checked={todo.done} onChange={() => toggleTask(todo.id)} />
                  <span className={todo.done ? 'done' : ''}>{todo.text}</span>
                </label>
                <button type="button" className="ghost" onClick={() => removeTask(todo.id)}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="footer">
            <button type="button" className="ghost small" onClick={clearCompleted}>Clear completed</button>
          </div>
        </div>
      </section>
    </main>
  );
}
