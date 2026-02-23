# FrontendAtlas UI Primitives

This folder defines app-level UI primitives. Feature pages should use these APIs instead of ad-hoc visual classes or direct PrimeNG usage for core controls.

## Components

`FaButtonComponent` (`button[faButton]`, `a[faButton]`)
- Inputs: `variant`, `size`, `icon`, `iconPosition`, `loading`, `disabled`, `block`, `iconOnly`, `type`
- Purpose: standard action styling and states for button/link actions.

`FaChipComponent` (`fa-chip`)
- Backward compatible with existing selector/API.
- Use explicit variant/size/selected inputs rather than class-only customization in new surfaces.

`FaCardComponent` (`[faCard]`)
- Inputs: `interactive`, `elevated`, `padding`, `disabled`, `as`
- Purpose: standard card shell for sections, tiles, and clickable cards.

`FaFieldComponent` (`fa-field`)
- Inputs: `label`, `hint`, `error`, `required`, `disabled`
- Purpose: consistent field label/hint/error structure around inputs/selects/textareas.

`FaDialogComponent` (`fa-dialog`)
- Wrapper over `p-dialog`.
- Inputs: `visible`, `header`, `modal`, `closable`, `dismissableMask`, `draggable`, `resizable`, `blockScroll`, `closeOnEscape`, `showHeader`, `showFooter`, `width`, `maxWidth`, `styleClass`, `appendTo`, `contentStyle`, `actionsAlign`
- Slots: `[faDialogHeader]`, `[faDialogFooter]`.

`FaSelectComponent` (`fa-select`)
- Wrapper for `p-dropdown` / `p-multiSelect`.
- Inputs: `options`, `value`, `multiple`, `disabled`, `filter`, `showToggleAll`, `optionLabel`, `optionValue`, `placeholder`, `appendTo`, `styleClass`, `panelStyleClass`
- Output: `valueChange`.

`FaSpinnerComponent` (`fa-spinner`)
- Wrapper for `p-progressSpinner`.
- Inputs: `size`, `strokeWidth`, `animationDuration`, `styleClass`, `label`.

## Policy

- Interactive UI should use primitives (`faButton`, `faCard`, `fa-field`, etc.).
- PrimeNG controls should be wrapped at shared-ui level for reuse.
- New `::ng-deep` should only exist in approved bridge layers.
- Keep layout classes local to features; keep visual treatment in primitives/tokens.
