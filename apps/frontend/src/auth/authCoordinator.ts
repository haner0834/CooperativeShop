let authPromise: Promise<any> | null = null;

export function ensureAuth(restoreFn: () => Promise<any>) {
  if (!authPromise) {
    authPromise = restoreFn().finally(() => {
      authPromise = null;
    });
  }
  return authPromise;
}
