import { makeVuePreviewHtml } from './vue-preview-builder';

describe('makeVuePreviewHtml', () => {
  type Rendered = { frame: HTMLIFrameElement; doc: Document; meta: string; message: string };
  const frames: HTMLIFrameElement[] = [];

  afterEach(() => {
    for (const frame of frames.splice(0)) frame.remove();
  });

  /** Loads the preview into a frame and waits until App has rendered or the overlay reports an error. */
  async function render(files: Record<string, string>): Promise<Rendered> {
    const frame = document.createElement('iframe');
    frame.srcdoc = makeVuePreviewHtml(files, window.location.origin);
    frames.push(frame);
    document.body.appendChild(frame);
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      const doc = frame.contentDocument;
      const meta = doc?.getElementById('_fa_overlay_meta')?.textContent || '';
      const painted = (doc?.getElementById('app')?.childNodes.length ?? 0) > 0;
      if (doc && (meta || painted)) {
        return { frame, doc, meta, message: doc.getElementById('_fa_overlay_msg')?.textContent || '' };
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('the preview neither rendered nor reported an error');
  }

  const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

  it('renders a component that <script setup> declares, with kebab-case props', async () => {
    const { doc, meta } = await render({
      'src/App.vue': `
        <template>
          <FaqItem
            v-for="item in faqItems"
            :key="item.id"
            :is-open="isItemOpen(item.id)"
          />
        </template>

        <script setup lang="ts">
        import { defineComponent } from 'vue';

        const FaqItem = defineComponent({
          props: { isOpen: Boolean },
          template: '<p class="faq">{{ isOpen ? "open" : "closed" }}</p>',
        });
        const faqItems = [{ id: 'faq-1' }, { id: 'faq-2' }];
        const isItemOpen = (itemId: string) => itemId === 'faq-1';
        </script>
      `,
    });

    expect(meta).toBe('');
    expect([...doc.querySelectorAll('.faq')].map((node) => node.textContent)).toEqual(['open', 'closed']);
  });

  it('compiles every imported file: a child with defineProps, defineEmits and defineModel, and a helper used in the template', async () => {
    const { doc, meta } = await render({
      'src/App.vue': [
        '<template>',
        '  <Stepper v-model="count" label="Quantity" @limit="limitHit = true" />',
        '  <p class="total">{{ formatTotal(count) }}</p>',
        '  <p v-if="limitHit" class="limit">limit</p>',
        '</template>',
        '<script setup lang="ts">',
        "import { ref } from 'vue';",
        "import Stepper from './components/Stepper.vue';",
        "import { formatTotal } from './format';",
        'const count = ref(1);',
        'const limitHit = ref(false);',
        '</script>',
      ].join('\n'),
      'src/components/Stepper.vue': [
        '<template>',
        '  <button class="inc" :aria-label="`Increase ${label}`" @click="increase">+</button>',
        '</template>',
        '<script setup lang="ts">',
        'defineProps<{ label: string }>();',
        'const emit = defineEmits<{ limit: [] }>();',
        'const model = defineModel<number>({ required: true });',
        'function increase(): void {',
        '  if (model.value >= 2) {',
        "    emit('limit');",
        '    return;',
        '  }',
        '  model.value += 1;',
        '}',
        '</script>',
      ].join('\n'),
      'src/format.ts': "export function formatTotal(value: number): string { return 'Total: ' + value; }",
    });

    expect(meta).toBe('');
    const button = doc.querySelector<HTMLButtonElement>('button.inc')!;
    expect(button.getAttribute('aria-label')).toBe('Increase Quantity');
    expect(doc.querySelector('.total')?.textContent).toBe('Total: 1');
    button.click();
    await settle();
    expect(doc.querySelector('.total')?.textContent).toBe('Total: 2');
    expect(doc.querySelector('.limit')).toBeNull();
    button.click();
    await settle();
    expect(doc.querySelector('.limit')?.textContent).toBe('limit');
  });

  it('starts no timer of its own, so a leak check after unmount sees only the app\'s timers', async () => {
    const { frame, meta } = await render({ 'src/App.vue': '<template><p class="out">ready</p></template>' });

    expect(meta).toBe('');
    const preview = frame.contentWindow as Window & {
      __FA_GET_PREVIEW_LEAKS: () => { timers: number };
      __FA_UNMOUNT_PREVIEW: () => void;
    };
    expect(preview.__FA_GET_PREVIEW_LEAKS().timers).toBe(0);
    preview.__FA_UNMOUNT_PREVIEW();
    expect(preview.__FA_GET_PREVIEW_LEAKS().timers).toBe(0);
  });

  it('lets <script setup> and a .ts module import nextTick and other helpers from vue', async () => {
    const { doc, meta } = await render({
      'src/App.vue': [
        '<template><p class="out">{{ label }}</p></template>',
        '<script setup lang="ts">',
        "import { nextTick, onMounted, ref } from 'vue';",
        "import { settled } from './settle';",
        "const label = ref('waiting');",
        'onMounted(async () => {',
        '  await nextTick();',
        '  label.value = await settled();',
        '});',
        '</script>',
      ].join('\n'),
      'src/settle.ts': "import { nextTick } from 'vue';\nexport async function settled(): Promise<string> {\n  await nextTick();\n  return 'settled';\n}",
    });

    expect(meta).toBe('');
    const deadline = Date.now() + 5_000;
    while (doc.querySelector('.out')?.textContent !== 'settled' && Date.now() < deadline) await settle();
    expect(doc.querySelector('.out')?.textContent).toBe('settled');
  });

  it('scopes a <style scoped> block to the component that declares it', async () => {
    const { frame, doc, meta } = await render({
      'src/App.vue': [
        '<template><div class="box app-box">app</div><Child /></template>',
        '<script setup lang="ts">',
        "import Child from './Child.vue';",
        '</script>',
        '<style scoped>',
        '.box { color: rgb(255, 0, 0); }',
        '</style>',
      ].join('\n'),
      // Not the child's root: Vue gives a child's root element the parent's scope too, so the parent can lay it out.
      'src/Child.vue': '<template><section><div class="box child-box">child</div></section></template>',
    });

    expect(meta).toBe('');
    const colorOf = (selector: string) => frame.contentWindow!.getComputedStyle(doc.querySelector(selector)!).color;
    expect(colorOf('.app-box')).toBe('rgb(255, 0, 0)');
    expect(colorOf('.child-box')).not.toBe('rgb(255, 0, 0)');
  });

  it('reports a template error at its line in the .vue file', async () => {
    const { meta, message } = await render({
      'src/App.vue': [
        '<template>',
        '  <main>',
        '    <p v-if>missing</p>',
        '  </main>',
        '</template>',
        '<script setup lang="ts">',
        'const ready = true;',
        '</script>',
      ].join('\n'),
    });

    expect(meta).toMatch(/^src\/App\.vue:3:\d+$/);
    expect(message).toContain('v-if');
  });

  it('reports a script error at its line in the .vue file', async () => {
    const { meta } = await render({
      'src/App.vue': [
        '<template>',
        '  <p>{{ count }}</p>',
        '</template>',
        '<script setup lang="ts">',
        "import { ref } from 'vue';",
        'const count = ref(;',
        '</script>',
      ].join('\n'),
    });

    expect(meta).toMatch(/^src\/App\.vue:6:\d+$/);
  });

  it('reports an error in an imported .ts file at that file\'s own line', async () => {
    const { meta } = await render({
      'src/App.vue': [
        '<template><p>{{ label }}</p></template>',
        '<script setup lang="ts">',
        "import { label } from './labels';",
        '</script>',
      ].join('\n'),
      'src/labels.ts': ['// labels', "export const label = 'x' +;"].join('\n'),
    });

    expect(meta).toMatch(/^src\/labels\.ts:2:\d+$/);
  });
});
