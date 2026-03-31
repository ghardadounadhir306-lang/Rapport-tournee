/**
 * API base URL for fetch calls.
 * - If VITE_API_URL is unset: use relative paths (Vite dev proxy forwards /api to the backend).
 * - If set (e.g. production API origin): prefix requests with that origin.
 */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  const root = import.meta.env.VITE_API_URL
  if (root && String(root).trim() !== '') {
    return `${String(root).replace(/\/$/, '')}${p}`
  }
  return p
}
