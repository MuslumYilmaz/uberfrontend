export type TurnstileChallengeAction = 'contact' | 'bug_report';

export type TurnstileChallengeState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'verified'
  | 'expired'
  | 'error';

export interface TurnstileWidgetOptions {
  sitekey: string;
  action: TurnstileChallengeAction;
  appearance: 'interaction-only';
  size: 'flexible';
  theme: 'auto';
  'refresh-expired': 'auto';
  'refresh-timeout': 'auto';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': (errorCode?: string) => void;
  'timeout-callback': () => void;
  'unsupported-callback': () => void;
}

export interface TurnstileApi {
  render(container: HTMLElement | string, options: TurnstileWidgetOptions): string;
  reset(widgetId?: string): void;
  remove(widgetId: string): void;
}

export interface TurnstileWindow extends Window {
  turnstile?: TurnstileApi;
}
