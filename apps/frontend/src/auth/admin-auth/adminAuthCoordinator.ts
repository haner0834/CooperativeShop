let adminAuthPromise: Promise<any> | null = null;

export function ensureAdminAuth(restoreFn: () => Promise<any>) {
  if (!adminAuthPromise) {
    adminAuthPromise = restoreFn().finally(() => {
      adminAuthPromise = null;
    });
  }
  return adminAuthPromise;
}
