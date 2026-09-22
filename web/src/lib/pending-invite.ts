const STORAGE_KEY = "roommate:pending-invite";

export function savePendingInvite(code: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    // sessionStorage unavailable (private mode, etc.) — invite just won't survive a redirect.
  }
}

export function getPendingInvite(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingInvite() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
