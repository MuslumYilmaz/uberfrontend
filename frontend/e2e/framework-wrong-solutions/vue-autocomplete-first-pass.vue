<!-- Wrong (round agent 05): a pick reopens the list, the arrows do not wrap, and a late search wins. -->
<template>
  <main class="page">
    <section class="card">
      <h1 class="title">Autocomplete</h1>

      <div
        ref="rootRef"
        class="combo"
        role="combobox"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
        :aria-owns="listboxId"
        :aria-activedescendant="activeDesc"
      >
        <label class="label" for="q">Search</label>
        <input
          id="q"
          class="input"
          type="text"
          autocomplete="off"
          placeholder="Type a city..."
          :value="query"
          @input="onInput"
          @focus="onFocus"
          @keydown="onKeyDown"
        />

        <ul v-if="isOpen" class="list" role="listbox" :id="listboxId">
          <li
            v-for="(item, i) in results"
            :key="item"
            class="option"
            :class="{ active: i === activeIndex }"
            role="option"
            :id="optionId(i)"
            :aria-selected="i === activeIndex"
            @mousedown="select(item)"
            v-html="highlight(item, query)"
          />

          <li v-if="isLoading" class="empty">Loading…</li>
          <li v-else-if="results.length === 0" class="empty">No results</li>
        </ul>
      </div>

      <p class="hint">Keyboard: ↑/↓ navigate, Enter select, Esc close.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const listboxId = 'autocomplete-listbox';

const CITIES: string[] = [
  'Amsterdam', 'Ankara', 'Athens', 'Austin',
  'Barcelona', 'Berlin', 'Boston', 'Brussels',
  'Chicago', 'Copenhagen',
  'Dubai',
  'Edinburgh',
  'Frankfurt',
  'Hamburg',
  'Istanbul', 'Izmir',
  'London', 'Los Angeles',
  'Madrid', 'Miami', 'Milan', 'Munich',
  'New York',
  'Oslo',
  'Paris', 'Prague',
  'Rome',
  'San Diego', 'San Francisco', 'San Jose', 'Seattle',
  'Tokyo',
  'Vienna',
  'Zurich'
];

const rootRef = ref<HTMLElement | null>(null);

const query = ref('');
const isOpen = ref(false);
const activeIndex = ref(-1);
const results = ref<string[]>([]);
const isLoading = ref(false);

const activeDesc = computed(() => (activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined));

// first pass: debounce with a timer, no cleanup / stale guard yet
let timer: ReturnType<typeof setTimeout> | undefined;

watch(query, (val) => {
  const q = val.trim();
  if (!q) {
    isOpen.value = false;
    results.value = [];
    isLoading.value = false;
    return;
  }
  isOpen.value = true;
  isLoading.value = true;
  timer = setTimeout(async () => {
    results.value = await search(q);
    isLoading.value = false;
    activeIndex.value = -1;
  }, 300);
});

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value;
}

function onFocus() {
  if (query.value.trim()) isOpen.value = true;
}

function onKeyDown(ev: KeyboardEvent) {
  if (!isOpen.value) return;
  if (ev.key === 'ArrowDown') {
    ev.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1);
  } else if (ev.key === 'ArrowUp') {
    ev.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (ev.key === 'Enter') {
    if (activeIndex.value >= 0) select(results.value[activeIndex.value]);
  } else if (ev.key === 'Escape') {
    isOpen.value = false;
    activeIndex.value = -1;
  }
}

function select(value: string) {
  query.value = value;
  isOpen.value = false;
  activeIndex.value = -1;
}

function optionId(i: number): string {
  return `opt-${i}`;
}

function highlight(item: string, queryRaw: unknown): string {
  const q = String(queryRaw ?? '').trim();
  if (!q) return escapeHtml(item);
  const idx = item.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return escapeHtml(item);
  return (
    escapeHtml(item.slice(0, idx)) +
    '<mark>' + escapeHtml(item.slice(idx, idx + q.length)) + '</mark>' +
    escapeHtml(item.slice(idx + q.length))
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function onDocMouseDown(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    isOpen.value = false;
    activeIndex.value = -1;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown);
});

onBeforeUnmount(() => {
  // TODO later: remove the listener
});

async function search(q: string): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 150));
  const lower = q.toLowerCase();
  return CITIES.filter((c) => c.toLowerCase().includes(lower)).slice(0, 8);
}
</script>
