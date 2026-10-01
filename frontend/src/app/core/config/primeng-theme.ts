import { definePreset } from '@primeuix/themes';
import LaraBase from '@primeuix/themes/lara/base';
import button from '@primeuix/themes/lara/button';
import card from '@primeuix/themes/lara/card';
import checkbox from '@primeuix/themes/lara/checkbox';
import chip from '@primeuix/themes/lara/chip';
import dialog from '@primeuix/themes/lara/dialog';
import iconfield from '@primeuix/themes/lara/iconfield';
import inputtext from '@primeuix/themes/lara/inputtext';
import multiselect from '@primeuix/themes/lara/multiselect';
import progressspinner from '@primeuix/themes/lara/progressspinner';
import select from '@primeuix/themes/lara/select';
import slider from '@primeuix/themes/lara/slider';
import textarea from '@primeuix/themes/lara/textarea';
import tooltip from '@primeuix/themes/lara/tooltip';

// Import only the Lara components used by the app, including nested controls.
const Lara = { ...LaraBase, components: { button, card, checkbox, chip, dialog, iconfield, inputtext, multiselect, progressspinner, select, slider, textarea, tooltip } };

/** Keep application tokens authoritative across pages and body-appended overlays. */
export const frontendAtlasPreset = definePreset(Lara, {
  semantic: {
    primary: { 50: '{amber.50}', 100: '{amber.100}', 200: '{amber.200}', 300: '{amber.300}', 400: '{amber.400}', 500: '{amber.500}', 600: '{amber.600}', 700: '{amber.700}', 800: '{amber.800}', 900: '{amber.900}', 950: '{amber.950}' },
    formField: { paddingX: '0.75rem', paddingY: '0.75rem', borderRadius: '6px' },
    list: { padding: '0', gap: '0', option: { padding: '0.75rem 1.25rem', borderRadius: '0' } },
    colorScheme: {
      dark: {
        primary: { color: 'var(--uf-accent)', contrastColor: 'var(--uf-bg)', hoverColor: 'var(--uf-accent-strong)', activeColor: 'var(--uf-accent)' },
        highlight: { background: 'var(--uf-accent-soft)', focusBackground: 'var(--uf-accent-soft)', color: 'var(--uf-text-primary)', focusColor: 'var(--uf-text-primary)' },
        text: { color: 'var(--uf-text-primary)', hoverColor: 'var(--uf-text-primary)', mutedColor: 'var(--uf-text-secondary)', hoverMutedColor: 'var(--uf-text-secondary)' },
        content: { background: 'var(--uf-surface)', hoverBackground: 'var(--uf-surface-alt)', borderColor: 'var(--uf-border-subtle)' },
        formField: {
          background: 'var(--uf-surface-alt)', disabledBackground: 'var(--uf-surface)',
          borderColor: 'var(--uf-border-subtle)', hoverBorderColor: 'var(--uf-text-secondary)', focusBorderColor: 'var(--uf-accent)',
          color: 'var(--uf-text-primary)', disabledColor: 'var(--uf-text-tertiary)', placeholderColor: 'var(--uf-text-secondary)',
        },
        overlay: {
          select: { background: 'var(--uf-surface)', borderColor: 'var(--uf-border-subtle)', color: 'var(--uf-text-primary)' },
          modal: { background: 'var(--uf-surface)', borderColor: 'var(--uf-border-subtle)', color: 'var(--uf-text-primary)' },
        },
      },
    },
  },
  components: {
    inputtext: { root: { paddingX: '0', paddingY: '0' } },
    textarea: { root: { paddingX: '0', paddingY: '0' } },
    select: { dropdown: { width: '3rem' } },
    multiselect: { dropdown: { width: '3rem' } },
    dialog: { header: { padding: '1.5rem' }, content: { padding: '0 1.5rem 2rem 1.5rem' }, footer: { padding: '0 1.5rem 1.5rem 1.5rem' } },
  },
});

export const frontendAtlasPrimeTheme = {
  preset: frontendAtlasPreset,
  options: {
    darkModeSelector: '.fa-dark',
    cssLayer: { name: 'primeng', order: 'tailwind-base, primeng, tailwind-utilities' },
  },
};
