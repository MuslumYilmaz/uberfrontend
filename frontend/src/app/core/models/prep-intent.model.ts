export type PrepIntent =
  | 'solve_now'
  | 'guided_plan'
  | 'company_target'
  | 'warmup_index';

export type PrepLauncherEventPayload = {
  surface: string;
  selected_intent?: PrepIntent;
  is_logged_in: boolean;
  entry_route: string;
  session_id: string;
  [key: string]: unknown;
};
