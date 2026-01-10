import { QuestionKind } from '../core/models/question.model';
import { Tech } from '../core/models/user.model';

export type FrameworkVariant = { tech: Tech; id: string; kind: QuestionKind };
export type FrameworkFamily = { key: string; members: FrameworkVariant[] };

export const FRAMEWORK_FAMILIES: FrameworkFamily[] = [
  {
    key: 'counter',
    members: [
      { tech: 'react', id: 'react-counter', kind: 'coding' },
      { tech: 'angular', id: 'angular-counter-starter', kind: 'coding' },
      { tech: 'vue', id: 'vue-counter', kind: 'coding' },
    ],
  },
  {
    key: 'contact-form',
    members: [
      { tech: 'react', id: 'react-contact-form-starter', kind: 'coding' },
      { tech: 'angular', id: 'angular-contact-form-starter', kind: 'coding' },
      { tech: 'vue', id: 'vue-contact-form-starter', kind: 'coding' },
    ],
  },
  {
    key: 'todo-list',
    members: [
      { tech: 'react', id: 'react-todo-list', kind: 'coding' },
      { tech: 'angular', id: 'angular-todo-list-starter', kind: 'coding' },
      { tech: 'vue', id: 'vue-todo-list', kind: 'coding' },
    ],
  },
  {
    key: 'image-slider',
    members: [
      { tech: 'react', id: 'react-image-slider', kind: 'coding' },
      { tech: 'angular', id: 'angular-image-slider-starter', kind: 'coding' },
      { tech: 'vue', id: 'vue-image-slider', kind: 'coding' },
    ],
  },
  {
    key: 'tabs-switcher',
    members: [
      { tech: 'react', id: 'react-tabs-switcher', kind: 'coding' },
      { tech: 'angular', id: 'angular-tabs-switcher', kind: 'coding' },
      { tech: 'vue', id: 'vue-tabs-switcher', kind: 'coding' },
    ],
  },
  {
    key: 'filterable-list',
    members: [
      { tech: 'react', id: 'react-filterable-user-list', kind: 'coding' },
      { tech: 'angular', id: 'angular-filterable-user-list', kind: 'coding' },
      { tech: 'vue', id: 'vue-filterable-user-list', kind: 'coding' },
    ],
  },
  {
    key: 'accordion',
    members: [
      { tech: 'react', id: 'react-accordion-faq', kind: 'coding' },
      { tech: 'angular', id: 'angular-faq-accordion', kind: 'coding' },
      { tech: 'vue', id: 'vue-accordion-faq', kind: 'coding' },
    ],
  },
  {
    key: 'pagination-table',
    members: [
      { tech: 'react', id: 'react-pagination-table', kind: 'coding' },
      { tech: 'angular', id: 'angular-pagination-table', kind: 'coding' },
      { tech: 'vue', id: 'vue-pagination-table', kind: 'coding' },
    ],
  },
  {
    key: 'theme-toggle',
    members: [
      { tech: 'react', id: 'react-theme-toggle', kind: 'coding' },
      { tech: 'angular', id: 'angular-theme-toggle', kind: 'coding' },
      { tech: 'vue', id: 'vue-theme-toggle', kind: 'coding' },
    ],
  },
  {
    key: 'multi-step',
    members: [
      { tech: 'react', id: 'react-multi-step-signup', kind: 'coding' },
      { tech: 'angular', id: 'angular-multi-step-form-starter', kind: 'coding' },
      { tech: 'vue', id: 'vue-multi-step-form', kind: 'coding' },
    ],
  },
  {
    key: 'shopping-cart',
    members: [
      { tech: 'react', id: 'react-shopping-cart', kind: 'coding' },
      { tech: 'angular', id: 'angular-shopping-cart-mini', kind: 'coding' },
      { tech: 'vue', id: 'vue-shopping-cart', kind: 'coding' },
    ],
  },
  {
    key: 'debounced-search',
    members: [
      { tech: 'react', id: 'react-debounced-search', kind: 'coding' },
      { tech: 'angular', id: 'angular-debounced-search', kind: 'coding' },
      { tech: 'vue', id: 'vue-debounced-search', kind: 'coding' },
    ],
  },
  {
    key: 'star-rating',
    members: [
      { tech: 'react', id: 'react-star-rating', kind: 'coding' },
      { tech: 'angular', id: 'angular-star-rating', kind: 'coding' },
      { tech: 'vue', id: 'vue-star-rating', kind: 'coding' },
    ],
  },
  {
    key: 'dynamic-table',
    members: [
      { tech: 'react', id: 'react-dynamic-table', kind: 'coding' },
      { tech: 'angular', id: 'angular-dynamic-table-starter', kind: 'coding' },
      { tech: 'vue', id: 'vue-dynamic-table', kind: 'coding' },
    ],
  },
  {
    key: 'nested-checkboxes',
    members: [
      { tech: 'react', id: 'react-nested-checkboxes', kind: 'coding' },
      { tech: 'angular', id: 'angular-nested-checkboxes', kind: 'coding' },
      { tech: 'vue', id: 'vue-nested-checkboxes', kind: 'coding' },
    ],
  },
  {
    key: 'autocomplete-search',
    members: [
      { tech: 'react', id: 'react-autocomplete-search-starter', kind: 'coding' },
      { tech: 'angular', id: 'angular-autocomplete-search-starter', kind: 'coding' },
      { tech: 'vue', id: 'vue-autocomplete-search', kind: 'coding' },
    ],
  },
  {
    key: 'transfer-list',
    members: [
      { tech: 'react', id: 'react-transfer-list', kind: 'coding' },
      { tech: 'angular', id: 'angular-transfer-list', kind: 'coding' },
      { tech: 'vue', id: 'vue-transfer-list', kind: 'coding' },
    ],
  },
  {
    key: 'tictactoe',
    members: [
      { tech: 'react', id: 'react-tictactoe', kind: 'coding' },
      { tech: 'angular', id: 'angular-tictactoe-starter', kind: 'coding' },
      { tech: 'vue', id: 'vue-tictactoe', kind: 'coding' },
    ],
  },
  {
    key: 'like-button',
    members: [
      { tech: 'react', id: 'react-like-button', kind: 'coding' },
      { tech: 'angular', id: 'angular-like-button', kind: 'coding' },
      { tech: 'vue', id: 'vue-like-button', kind: 'coding' },
    ],
  },
  {
    key: 'progress-bar-thresholds',
    members: [
      { tech: 'react', id: 'react-progress-bar-thresholds', kind: 'coding' },
      { tech: 'angular', id: 'angular-progress-bar-thresholds', kind: 'coding' },
      { tech: 'vue', id: 'vue-progress-bar-thresholds', kind: 'coding' },
    ],
  },
  {
    key: 'nested-comments',
    members: [
      { tech: 'react', id: 'react-nested-comments', kind: 'coding' },
      { tech: 'angular', id: 'angular-nested-comments', kind: 'coding' },
      { tech: 'vue', id: 'vue-nested-comments', kind: 'coding' },
    ],
  },
  {
    key: 'dynamic-counter-buttons',
    members: [
      { tech: 'react', id: 'react-dynamic-counter-buttons', kind: 'coding' },
      { tech: 'angular', id: 'angular-dynamic-counter-buttons', kind: 'coding' },
      { tech: 'vue', id: 'vue-dynamic-counter-buttons', kind: 'coding' },
    ],
  },
];

export const FRAMEWORK_FAMILY_BY_ID = FRAMEWORK_FAMILIES.reduce((acc, fam) => {
  fam.members.forEach((m) => acc.set(m.id, fam));
  return acc;
}, new Map<string, FrameworkFamily>());

export function frameworkLabel(tech: Tech): string {
  switch (tech) {
    case 'react': return 'React';
    case 'angular': return 'Angular';
    case 'vue': return 'Vue';
    default: return 'JS';
  }
}
