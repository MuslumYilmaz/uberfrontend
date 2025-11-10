// core/utils/iframe-preview.util.ts
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export function writeHtmlToIframe(
    frameEl: HTMLIFrameElement | undefined,
    sanitizer: DomSanitizer,
    html: string | null,
    currentUrl: SafeResourceUrl | null,
    setUrl: (v: SafeResourceUrl | null) => void
): void {
    // If iframe not yet available, one-shot retry
    if (!frameEl) {
        requestAnimationFrame(() => {
            if (frameEl) writeHtmlToIframe(frameEl, sanitizer, html, currentUrl, setUrl);
        });
        return;
    }

    if (!html) {
        const doc = frameEl.contentDocument;
        if (doc) {
            doc.open();
            doc.write('<!doctype html><meta charset="utf-8">');
            doc.close();
        }
        setUrl(null);
        return;
    }

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    if (frameEl.contentWindow) {
        frameEl.contentWindow.location.replace(url);
    } else {
        frameEl.onload = () => frameEl.contentWindow?.location.replace(url);
        frameEl.src = url;
    }

    setUrl(sanitizer.bypassSecurityTrustResourceUrl(url));
}
