<!-- Wrong (the official solution before 2026-11-12): the watcher clears its timer but not the search already running,
     so a late response for an older query replaces newer results. -->
<template>
  <main class="main">
    <section class="card">
      <header class="header">
        <h1 class="title">Debounced Search (Solution)</h1>
        <p class="subtitle">
          Type to search a fake user directory. Search runs 500ms after you stop typing.
        </p>
      </header>

      <div class="field">
        <label class="label" for="search-input">Search</label>
        <input
          id="search-input"
          class="input"
          type="text"
          :value="query"
          @input="onInput"
          placeholder="Start typing a name or email..."
          autocomplete="off"
        />
      </div>

      <div class="status-row">
        <span v-if="isLoading" class="status status--loading">Searching…</span>
        <span
          v-else-if="!error && query"
          class="status"
        >
          Showing {{ results.length }} result(s) for "{{ query }}"
        </span>
        <span
          v-else-if="!error && !query"
          class="status status--muted"
        >
          Start typing to search.
        </span>
        <span v-if="error" class="status status--error">{{ error }}</span>
      </div>

      <ul class="results" v-if="results.length">
        <li class="result-row" v-for="r in results" :key="r.id">
          <div class="result-name">{{ r.name }}</div>
          <div class="result-email">{{ r.email }}</div>
        </li>
      </ul>

      <p
        class="empty"
        v-if="!results.length && !isLoading && query && !error"
      >
        No results found for "{{ query }}".
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Result {
  id: number;
  name: string;
  email: string;
}

const FAKE_DATA: Result[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Kim', email: 'charlie@example.com' },
  { id: 4, name: 'Diana Lopez', email: 'diana@example.com' },
  { id: 5, name: 'Ethan Brown', email: 'ethan@example.com' },
  { id: 6, name: 'Fiona Patel', email: 'fiona@example.com' }
];

function fakeApiSearch(term: string): Promise<Result[]> {
  const trimmed = term.trim().toLowerCase();
  const delayMs = 600;

  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (!trimmed) {
        resolve([]);
        return;
      }

      if (trimmed === 'error') {
        reject(new Error('Fake API error'));
        return;
      }

      const filtered = FAKE_DATA.filter((item) => {
        const name = item.name.toLowerCase();
        const mail = item.email.toLowerCase();
        return name.includes(trimmed) || mail.includes(trimmed);
      });

      resolve(filtered);
    }, delayMs);
  });
}

const query = ref('');
const results = ref<Result[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

let timeoutId: number | undefined;

watch(
  query,
  (value, _oldValue, onInvalidate) => {
    const trimmed = value.trim();

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (!trimmed) {
      results.value = [];
      isLoading.value = false;
      error.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;

    timeoutId = window.setTimeout(() => {
      fakeApiSearch(trimmed)
        .then((data) => {
          results.value = data;
          isLoading.value = false;
        })
        .catch((err) => {
          results.value = [];
          isLoading.value = false;
          error.value = err instanceof Error ? err.message : 'Something went wrong.';
        });
    }, 500);

    onInvalidate(() => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    });
  }
);

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  query.value = target.value;
};
</script>
