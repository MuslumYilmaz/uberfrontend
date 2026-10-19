import { Pipe, PipeTransform } from '@angular/core';

import { stripInlineMarkup } from './inline-code.component';

/**
 * Plain text for titles in dense lists. fa-inline-code adds markup to every
 * row, which the prerendered /coding page cannot afford.
 */
@Pipe({ name: 'stripInlineMarkup' })
export class StripInlineMarkupPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return stripInlineMarkup(value);
  }
}
