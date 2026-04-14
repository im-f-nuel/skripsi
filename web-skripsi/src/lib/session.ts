/** In-memory session stats — reset saat halaman di-refresh */
const session = {
  detectionCount: 0,
  totalObjects: 0,
  lastClass: '—',
  lastTime: '—',
}

export function getSession() {
  return { ...session }
}

export function recordDetection(classes: string[], objectCount: number) {
  session.detectionCount += 1
  session.totalObjects += objectCount
  session.lastClass = classes[0] ?? '—'
  session.lastTime = new Date().toLocaleTimeString('id-ID', { hour12: false })
}
