/**
 * Utility to identify a player consistently across refresh or re-joins
 * without requiring a full auth system.
 * Uses crypto.randomUUID when available (HTTPS), otherwise falls back
 * to a manual UUID v4 generator (works on HTTP / local network).
 */
function generateUUID(): string {
  // crypto.randomUUID is only available on secure contexts (HTTPS).
  // Fallback for local HTTP development.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Manual UUID v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let id = localStorage.getItem('gharib_device_id');
  if (!id) {
    id = generateUUID();
    localStorage.setItem('gharib_device_id', id);
  }
  return id;
}
