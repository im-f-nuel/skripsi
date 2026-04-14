import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { getHistory } from '../lib/history'
import { getUser } from '../lib/auth'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const history = useMemo(() => getHistory(), [])

  // Hitung stats dari history
  const totalImages = history.length
  const totalObjects = history.reduce((s, h) => s + h.objects, 0)
  const avgConf = history.length > 0
    ? (history.reduce((s, h) => s + h.confidence, 0) / history.length).toFixed(1) + '%'
    : '—'
  const topClass = useMemo(() => {
    if (history.length === 0) return '—'
    const freq: Record<string, number> = {}
    history.forEach((h) => h.classes.forEach((c) => { freq[c] = (freq[c] ?? 0) + 1 }))
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  }, [history])

  const stats = [
    { label: 'Total Deteksi', value: totalObjects.toLocaleString('id-ID'), change: 'Semua sesi', icon: 'restaurant', color: 'bg-green-100 text-green-700' },
    { label: 'Rata-rata Confidence', value: avgConf, change: 'Dari riwayat', icon: 'gps_fixed', color: 'bg-blue-100 text-blue-700' },
    { label: 'Gambar Diproses', value: totalImages.toLocaleString('id-ID'), change: 'Total upload', icon: 'history', color: 'bg-purple-100 text-purple-700' },
    { label: 'Kelas Terbanyak', value: topClass, change: 'YOLOv8 best.pt', icon: 'category', color: 'bg-pink-100 text-pink-700' },
  ]

  const recentDetections = history.slice(0, 4)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[#111827] text-xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Selamat datang kembali, {user?.name ?? 'User'}</p>
        </div>
        <button
          onClick={() => navigate('/detect')}
          className="flex items-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Icon name="add" size={16} className="text-white" />
          Deteksi Baru
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-5 border border-[#E5E7EB]">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon name={s.icon} size={18} />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                  {s.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-[#111827]">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Upload Quick */}
          <div
            className="bg-white rounded-xl border border-[#E5E7EB] p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#059669] transition-colors"
            onClick={() => navigate('/detect')}
          >
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <Icon name="photo_camera" size={28} className="text-[#059669]" />
            </div>
            <div className="text-center">
              <div className="text-[#111827] font-semibold">Upload & Deteksi</div>
              <div className="text-gray-500 text-sm mt-1">Unggah gambar makanan untuk dianalisis</div>
            </div>
            <div className="w-full border-2 border-dashed border-[#E5E7EB] rounded-lg py-5 flex flex-col items-center gap-2 text-gray-400 hover:border-[#059669] transition-colors">
              <Icon name="upload" size={24} className="text-gray-300" />
              <span className="text-sm">Klik atau seret gambar ke sini</span>
            </div>
          </div>

          {/* Recent Detections */}
          <div className="col-span-2 bg-white rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-[#111827] font-semibold">Deteksi Terbaru</h2>
              <button onClick={() => navigate('/history')} className="text-[#059669] text-sm font-medium">
                Lihat Semua
              </button>
            </div>

            {recentDetections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
                <Icon name="history" size={40} className="text-gray-200" />
                <div className="text-sm">Belum ada riwayat deteksi</div>
                <button
                  onClick={() => navigate('/detect')}
                  className="text-xs text-[#059669] font-medium hover:underline"
                >
                  Mulai deteksi pertama
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#F3F4F6]">
                {recentDetections.map((d) => (
                  <div key={d.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                      <Icon name="image" size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#111827] truncate">{d.filename}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {d.classes.map((c) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-[#111827]">{d.confidence}%</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{d.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
