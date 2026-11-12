<!-- Wrong (round agent 05): a first pass that adds untrimmed text, keeps the input, and cannot remove. -->
<template>
  <main class="main">
    <section class="section">
      <h1>Todo List</h1>

      <div class="panel">
        <div class="input-row">
          <input
            type="text"
            placeholder="Add a new task..."
            v-model="newTask"
          />
          <button type="button" class="primary" @click="addTask">
            Add
          </button>
        </div>

        <ul class="list" v-if="hasTodos">
          <li
            v-for="todo in todos"
            :key="todo.id"
            class="item"
          >
            <label class="item-main">
              <input
                type="checkbox"
                :checked="todo.done"
                @change="toggleTask(todo.id)"
              />
              <span :class="{ done: todo.done }">{{ todo.text }}</span>
            </label>

            <button
              type="button"
              class="ghost"
              @click="removeTask(todo.id)"
            >
              Remove
            </button>
          </li>
        </ul>

        <p v-else class="empty">No tasks yet. Add your first one above.</p>

        <div class="footer" v-if="hasTodos">
          <button
            type="button"
            class="ghost small"
            @click="clearCompleted"
          >
            Clear completed
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const newTask = ref('');
const todos = ref<Todo[]>([]);
let nextId = 1;

const hasTodos = computed(() => todos.value.length > 0);

// first pass: add + toggle only, input not trimmed or cleared yet
const addTask = () => {
  todos.value.push({ id: nextId++, text: newTask.value, done: false });
};

const toggleTask = (id: number) => {
  const todo = todos.value.find((t) => t.id === id);
  if (todo) todo.done = !todo.done;
};

const removeTask = (_id: number) => {};

const clearCompleted = () => {};
</script>
