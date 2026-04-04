export const STORAGE_KEYS = {
  config: "capypulse:config",
  log: "capypulse:topic-log",
  session: "capypulse:session",
  drafts: "capypulse:drafts",
};

export async function storageGet(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export async function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { console.warn("Storage write failed:", e); }
}
