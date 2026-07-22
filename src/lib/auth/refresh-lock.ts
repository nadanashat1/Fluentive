let locked = false;
let lockPromise: Promise<void> = Promise.resolve();

/** Serialize token refresh across tabs / callers (minimal in-memory stub). */
export function acquireRefreshLock(): Promise<void> {
  if (!locked) {
    locked = true;
    lockPromise = Promise.resolve();
    return lockPromise;
  }
  return lockPromise;
}

export function releaseRefreshLock(): void {
  locked = false;
}

export function isRefreshLocked(): boolean {
  return locked;
}
