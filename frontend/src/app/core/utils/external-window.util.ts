export type ExternalWindowOpenResult = 'opened' | 'blocked' | 'hooked';

export type ExternalWindowReservation =
  | { kind: 'window'; target: Window }
  | { kind: 'hook' }
  | { kind: 'blocked' };

/**
 * Reserve a browser tab while the click still has user activation. The URL is
 * assigned only after the backend has created a checkout attempt.
 */
export function reserveExternalWindow(): ExternalWindowReservation {
  if (typeof window === 'undefined') return { kind: 'hook' };

  const hook = (window as any).__faCheckoutRedirect;
  if (typeof hook === 'function') return { kind: 'hook' };

  const opened = window.open('', '_blank');
  if (!opened) return { kind: 'blocked' };

  try {
    opened.opener = null;
  } catch { }

  return { kind: 'window', target: opened };
}

export function navigateReservedExternalWindow(
  reservation: ExternalWindowReservation,
  url: string,
): ExternalWindowOpenResult {
  if (typeof window === 'undefined') return 'opened';

  if (reservation.kind === 'hook') {
    const hook = (window as any).__faCheckoutRedirect;
    if (typeof hook === 'function') {
      hook(url);
      return 'hooked';
    }
    return 'blocked';
  }

  if (reservation.kind === 'blocked') return 'blocked';

  try {
    reservation.target.location.href = url;
    return 'opened';
  } catch {
    releaseExternalWindowReservation(reservation);
    return 'blocked';
  }
}

export function releaseExternalWindowReservation(
  reservation: ExternalWindowReservation | null | undefined,
): void {
  if (!reservation || reservation.kind !== 'window') return;
  try {
    reservation.target.close();
  } catch { }
}

export function openExternalWindow(url: string): ExternalWindowOpenResult {
  return navigateReservedExternalWindow(reserveExternalWindow(), url);
}
