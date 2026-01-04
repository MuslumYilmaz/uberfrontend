import { Injectable, signal } from '@angular/core';

export type PremiumGateReason = 'tracks' | 'company' | 'generic';

export interface PremiumGateState {
  visible: boolean;
  reason: PremiumGateReason;
  targetUrl?: string;
  isLoggedIn: boolean;
}

const DEFAULT_STATE: PremiumGateState = {
  visible: false,
  reason: 'generic',
  targetUrl: undefined,
  isLoggedIn: false,
};

@Injectable({ providedIn: 'root' })
export class PremiumGateService {
  private state = signal<PremiumGateState>({ ...DEFAULT_STATE });
  readonly dialogState = this.state.asReadonly();

  open(next: Omit<PremiumGateState, 'visible'>) {
    this.state.set({ visible: true, ...next });
  }

  close() {
    this.state.set({ ...DEFAULT_STATE });
  }
}
