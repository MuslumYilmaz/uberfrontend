import { makeVuePreviewHtml } from './vue-preview-builder';

describe('makeVuePreviewHtml', () => {
  it('exposes script-setup bindings used by kebab-case component props', () => {
    const html = makeVuePreviewHtml({
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

        const FaqItem = defineComponent({});
        const faqItems = [{ id: 'faq-1' }];
        const isItemOpen = (itemId: string) => itemId === 'faq-1';
        </script>
      `,
    });

    expect(html).toContain('<component :is="FaqItem"');
    expect(html).toContain('return { FaqItem, faqItems, isItemOpen };');
  });
});
