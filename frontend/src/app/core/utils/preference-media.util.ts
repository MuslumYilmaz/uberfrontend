import type { FrameworkTestMedia } from '../models/question.model';

/**
 * A page's markup and CSS with the media conditions for the given preferences settled: a condition that holds
 * becomes (min-width: 0px) and one that does not (max-width: 0px), so `not` and `and` around it keep their meaning
 * and a preview shows the light or the dark scheme whatever the visitor's own setting is. The check runner settles a
 * check's preferences the same way, on the page's parsed rules (`emulateMedia` in opaque-dom-check-runner.ts).
 */
export function rewritePreferenceMedia(source: string, media: FrameworkTestMedia): string {
  return source.replace(
    /\(\s*(prefers-color-scheme|prefers-reduced-motion)\s*(?::\s*([a-z-]+)\s*)?\)/gi,
    (whole: string, feature: string, value?: string) => {
      const name = feature.toLowerCase() as keyof FrameworkTestMedia;
      const wanted = media[name];
      if (!wanted) return whole;
      // A bare (prefers-reduced-motion) holds for any value but no-preference.
      const holds = value ? value.toLowerCase() === wanted : name !== 'prefers-reduced-motion' || wanted !== 'no-preference';
      return holds ? '(min-width: 0px)' : '(max-width: 0px)';
    },
  );
}
