import { useState } from 'react'
import Icon from '../components/Icon'
import { getHistory, clearHistory, deleteDetection, HistoryEntry } from '../lib/history'

const allClasses = ['nasi_putih', 'nasi_merah', 'roti_utuh', 'roti_tawar', 'mi_pasta', 'kentang', 'jagung', 'pisang']

export default function History() {
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('Semua Kelas')
  const [page, setPage] = useState(1)
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory())

  const PER_PAGE = 10

  const filtered = history.filter((h) => {
    const matchSearch =
      h.filename.toLowerCase().includes(search.toLowerCase()) ||
      h.classes.some((c) => c.toLowerCase().includes(search.toLowerCase()))
    const matchClass = classFilter === 'Semua Kelas' || h.classes.includes(classFilter)
    return matchSearch && matchClass
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleClear = () => {
    clearHistory()
    setHistory([])
    setPage(1)
  }

  const handleExportCSV = () => {
    if (history.length === 0) return
    const headers = ['ID', 'Filename', 'Classes', 'Confidence (%)', 'Objects', 'Time', 'Size']
    const rows = history.map((h) => [
      h.id,
      `"${h.filename}"`,
      `"${h.classes.join('; ')}"`,
      h.confidence,
      h.objects,
      `"${h.time}"`,
      h.size,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carbfood-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalObjects = history.reduce((s, h) => s + h.objects, 0)
  const avgConf = history.length > 0
    ? (history.reduce((s, h) => s + h.confidence, 0) / history.length).toFixed(1) + '%'
    : '—'
  const topClass = history.length > 0
    ? (() => {
        const freq: Record<string, number> = {}
        history.forEach((h) => h.classes.forEach((c) => { freq[c] = (freq[c] ?? 0) + 1 }))
        return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
      })()
    : '—'

  const summaryStats = [
    { label: 'Total Gambar', value: history.length.toString(), icon: 'image', color: 'bg-blue-100 text-blue-700' },
    { label: 'Objek Terdeteksi', value: totalObjects.toLocaleString('id-ID'), icon: 'gps_fixed', color: 'bg-green-100 text-green-700' },
    { label: 'Rata-rata Confidence', value: avgConf, icon: 'bolt', color: 'bg-purple-100 text-purple-700' },
    { label: 'Kelas Terbanyak', value: topClass, icon: 'restaurant', color: 'bg-orange-100 text-orange-700' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[#111827] text-xl font-bold">Riwayat Deteksi</h1>
          <p className="text-gray-500 text-sm mt-0.5">Seluruh riwayat deteksi gambar yang telah dilakukan</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="delete" size={15} className="text-red-400" />
            Hapus Semua
          </button>
          <button
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] text-[#374151] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="download" size={15} className="text-gray-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          {summaryStats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <Icon name={s.icon} size={20} />
              </div>
              <div>
                <div className="text-xl font-bold text-[#111827]">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
            <h2 className="font-semibold text-[#111827]">Log Deteksi</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] w-64">
                <Icon name="search" size={15} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau kelas..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="flex-1 bg-transparent text-sm outline-none text-[#374151] placeholder-gray-400"
                />
              </div>
              <select
                value={classFilter}
                onChange={(e) => { setClassFilter(e.target.value); setPage(1) }}
                className="h-9 px-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-sm text-[#374151] outline-none"
              >
                <option>Semua Kelas</option>
                {allClasses.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gambar</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kelas Terdeteksi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Confidence</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Objek</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Waktu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">
                      <Icon name="history" size={40} className="text-gray-200 mx-auto mb-2" />
                      <div className="text-sm">
                        {history.length === 0 ? 'Belum ada riwayat deteksi' : 'Tidak ada data ditemukan'}
                      </div>
                      {history.length === 0 && (
                        <div className="text-xs text-gray-300 mt-1">Lakukan deteksi gambar untuk melihat riwayat</div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                            <Icon name="image" size={20} className="text-gray-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#111827] max-w-[160px] truncate">{row.filename}</div>
                            <div className="text-xs text-gray-400">{row.size}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {row.classes.map((c) => (
                            <span key={c} className="text-[11px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                            <div className="h-full bg-[#059669] rounded-full" style={{ width: `${row.confidence}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-[#111827]">{row.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-[#111827]">{row.objects}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-500">{row.time}</span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => {
                            deleteDetection(row.id)
                            setHistory((prev) => prev.filter((h) => h.id !== row.id))
                          }}
                          className="text-xs text-red-400 font-medium hover:underline"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#F3F4F6]">
            <span className="text-sm text-gray-500">
              Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} data
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded border border-[#E5E7EB] text-gray-500 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <Icon name="chevron_left" size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 2), Math.min(totalPages, page + 1)
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded border text-sm transition-colors ${page === p ? 'bg-[#059669] border-[#059669] text-white' : 'border-[#E5E7EB] text-gray-500 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded border border-[#E5E7EB] text-gray-500 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <Icon name="chevron_right" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
