export interface HistoryEntry {
  id: string
  filename: string
  classes: string[]
  confidence: number
  objects: number
  time: string
  size: string
}

const HISTORY_KEY = 'carbfood_history'

export function saveDetection(entry: HistoryEntry, maxEntries = 500): void {
  const history = getHistory()
  history.unshift(entry)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, maxEntries)))
}

export function deleteDetection(id: string): void {
  const history = getHistory().filter((h) => h.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as HistoryEntry[]
  } catch {
    return []
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

/** Pre-populate dengan data demo jika riwayat masih kosong */
export function seedDemoHistory(): void {
  if (getHistory().length > 0) return
  const demo: HistoryEntry[] = [
    { id: 'd1', filename: 'nasi_putih_01.jpg', classes: ['nasi_putih'], confidence: 92.4, objects: 1, time: '2026-03-01 14:32', size: '1.2 MB' },
    { id: 'd2', filename: 'roti_tawar_005.jpg', classes: ['roti_tawar'], confidence: 88.1, objects: 1, time: '2026-03-01 13:15', size: '0.8 MB' },
    { id: 'd3', filename: 'mi_pasta_jagung.jpg', classes: ['mi_pasta', 'jagung'], confidence: 85.7, objects: 2, time: '2026-03-01 11:44', size: '2.1 MB' },
    { id: 'd4', filename: 'nasi_merah_kentang.jpg', classes: ['nasi_merah', 'kentang'], confidence: 90.3, objects: 2, time: '2026-03-01 10:08', size: '1.5 MB' },
    { id: 'd5', filename: 'pisang_roti_utuh.jpg', classes: ['pisang', 'roti_utuh'], confidence: 87.6, objects: 2, time: '2026-03-01 09:21', size: '0.9 MB' },
  ]
  localStorage.setItem(HISTORY_KEY, JSON.stringify(demo))
}
