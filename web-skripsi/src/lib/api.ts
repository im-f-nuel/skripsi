/**
 * Kembalikan URL lengkap untuk endpoint backend.
 * - Dev  : VITE_API_URL tidak di-set → path tetap '/api/...' → Vite proxy handle
 * - Prod : VITE_API_URL = Railway URL → '/api/health' jadi 'https://xxx.railway.app/health'
 */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL
  if (!base) return path
  return base.replace(/\/$/, '') + path.replace(/^\/api/, '')
}
