/** The Angular release the preview runs: this app's own, so the editor's typings and the runtime agree. */
export const ANGULAR_PREVIEW_VERSION = '21.2.25';

/** The workspace's runtime line for an Angular task. */
export const ANGULAR_PREVIEW_LABEL = `Angular ${ANGULAR_PREVIEW_VERSION.split('.')[0]} · zone.js`;

/**
 * The runtime line for one app: "zoneless" when its code asks for zoneless change detection, as the zoneless
 * debugging tasks do, and zone.js otherwise.
 */
export function angularPreviewLabel(sources: readonly string[]): string {
  const zoneless = sources.some((code) => /provide(?:Experimental)?ZonelessChangeDetection/.test(code));
  return zoneless ? `Angular ${ANGULAR_PREVIEW_VERSION.split('.')[0]} · zoneless` : ANGULAR_PREVIEW_LABEL;
}
