// Remembering the last menu selection is a convenience, never a requirement:
// every access is guarded so a private window or blocked storage is harmless.

const KLUCZ = 'generator-zadan-preferencje';

export function loadPreferences() {
  try {
    const raw = globalThis.localStorage?.getItem(KLUCZ);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function savePreferences(prefs) {
  try {
    globalThis.localStorage?.setItem(KLUCZ, JSON.stringify(prefs));
  } catch {
    // Storage unavailable or full; preferences simply are not remembered.
  }
}
