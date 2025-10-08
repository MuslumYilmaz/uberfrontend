import {
    AfterViewInit,
    Directive,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
} from '@angular/core';

import 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-typescript';

declare const Prism: any;

/**
 * Usage:
 * <code prism [lang]="'javascript'" [code]="yourCodeString"></code>
 */
@Directive({
    selector: 'code[prism]',
    standalone: true,
})
export class PrismHighlightDirective implements OnChanges, AfterViewInit {
    @Input() lang = 'javascript';
    @Input() code = '';

    constructor(private el: ElementRef<HTMLElement>) { }

    ngAfterViewInit(): void {
        this.render();
    }

    ngOnChanges(_: SimpleChanges): void {
        this.render();
    }

    private render(): void {
        const element = this.el.nativeElement;
        element.className = `language-${this.lang || 'javascript'}`;
        element.textContent = this.code ?? '';
        // Let Prism do its thing.
        Prism.highlightElement(element);
    }
}
