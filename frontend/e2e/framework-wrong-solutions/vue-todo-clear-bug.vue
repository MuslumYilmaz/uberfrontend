<!-- Wrong (round agent 05): Clear completed removes the wrong tasks. -->
<template>
  <main class="main">
    <section class="section">
      <h1>Todo List</h1>

      <div class="panel">
        <form class="input-row" @submit.prevent="addTask">
          <input
            type="text"
            placeholder="Add a new task..."
            v-model.trim="newTask"
          />
          <button type="submit" class="primary">
            Add
          </button>
        </form>

        <ul class="list" v-if="hasTodos">
          <li
            v-for="todo in todos"
            :key="todo.id"
            class="item"
          >
            <label class="item-main">
              <input type="checkbox" v-model="todo.done" />
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
          <span class="small">{{ remaining }} left</span>
          <button
            type="button"
            class="ghost small"
            :disabled="!hasCompleted"
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
const remaining = computed(() => todos.value.filter((t) => !t.done).length);
const hasCompleted = computed(() => todos.value.some((t) => t.done));

const addTask = () => {
  const text = newTask.value.trim();
  if (!text) return;
  todos.value.push({ id: nextId++, text, done: false });
  newTask.value = '';
};

// toggling is handled by v-model on the checkbox; kept for parity with the starter
const toggleTask = (id: number) => {
  const todo = todos.value.find((t) => t.id === id);
  if (todo) todo.done = !todo.done;
};

const removeTask = (id: number) => {
  todos.value = todos.value.filter((t) => t.id !== id);
};

// BUG on purpose (inverted predicate): keeps the completed ones
const clearCompleted = () => {
  todos.value = todos.value.filter((t) => t.done);
};
</script>
