// Wrong (round agent 08): only adding works.
import React, { useState } from 'react';
import './App.css';

type Todo = { id: number; text: string; done: boolean };

// Partial attempt: only "add" works. Toggle, remove and clear-completed are still no-ops.
export default function App() {
  const [newTask, setNewTask] = useState('');
  const [todos, setTodos] = useState([]);
  const typedTodos = todos as Todo[];
  const hasTodos = typedTodos.length > 0;

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    setTodos([...(todos as Todo[]), { id: Date.now(), text, done: false }] as any);
    setNewTask('');
  };
  const toggleTask = (_id: number) => {};
  const removeTask = (_id: number) => {};
  const clearCompleted = () => {};

  return (
    <main className="main">
      <section className="section">
        <h1>Todo List</h1>
        <div className="panel">
          <div className="input-row">
            <input type="text" placeholder="Add a new task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} />
            <button type="button" className="primary" onClick={addTask}>Add</button>
          </div>
          {hasTodos ? (
            <ul className="list">
              {typedTodos.map((todo) => (
                <li key={todo.id} className="item">
                  <label className="item-main">
                    <input type="checkbox" checked={todo.done} onChange={() => toggleTask(todo.id)} />
                    <span className={todo.done ? 'done' : ''}>{todo.text}</span>
                  </label>
                  <button type="button" className="ghost" onClick={() => removeTask(todo.id)}>Remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">No tasks yet. Add your first one above.</p>
          )}
          {hasTodos && (
            <div className="footer">
              <button type="button" className="ghost small" onClick={clearCompleted}>Clear completed</button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
