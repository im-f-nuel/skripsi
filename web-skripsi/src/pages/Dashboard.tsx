import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { getSession } from '../lib/session'

interface HealthStatus {
  status: 'ok' | 'error' | 'loading'
  modelLoaded: boolean
}

const modelCards = [
  { label: 'Arsitektur', value: 'YOLOv8n (Nano)', icon: 'model_training', color: 'bg-blue-50 text-blue-600' },
  { label: 'Jumlah Kelas', value: '8 Kelas', icon: 'restaurant', color: 'bg-green-50 text-green-600' },
  { label: 'mAP@0.5', value: '92.1%', icon: 'gps_fixed', color: 'bg-purple-50 text-purple-600' },
  { label: 'Waktu Inferensi', value: '< 3 detik', icon: 'bolt', color: 'bg-amber-50 text-amber-600' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const session = getSession()
  const [health, setHealth] = useState<HealthStatus>({ status: 'loading', modelLoaded: false })

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth({ status: d.status === 'ok' ? 'ok' : 'error', modelLoaded: d.model_loaded ?? true }))
      .catch(() => setHealth({ status: 'error', modelLoaded: false }))
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 md:py-5 bg-white border-b border-[#E5E7EB] flex items-center justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-[#111827] text-lg md:text-xl font-bold">Beranda</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-0.5 leading-tight">Sistem Deteksi Makanan Karbohidrat Berbasis YOLOv8</p>
        </div>
        <button
          onClick={() => navigate('/detect')}
          className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs md:text-sm font-semibold rounded-lg transition-colors flex-shrink-0 whitespace-nowrap"
        >
          <Icon name="photo_camera" size={15} className="text-white" />
          <span className="hidden sm:inline">Mulai Deteksi</span>
          <span className="sm:hidden">Deteksi</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
        {/* Status Backend */}
        <div className={`rounded-xl border p-4 md:p-5 flex items-center gap-3 md:gap-5 ${
          health.status === 'loading' ? 'bg-gray-50 border-gray-200' :
          health.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            health.status === 'loading' ? 'bg-gray-200' :
            health.status === 'ok' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Icon
              name={health.status === 'loading' ? 'hourglass_empty' : health.status === 'ok' ? 'check_circle' : 'error'}
              size={24}
              className={health.status === 'loading' ? 'text-gray-400' : health.status === 'ok' ? 'text-green-600' : 'text-red-500'}
            />
          </div>
          <div className="flex-1">
            <div className={`font-semibold text-sm ${
              health.status === 'loading' ? 'text-gray-600' :
              health.status === 'ok' ? 'text-green-700' : 'text-red-700'
            }`}>
              {health.status === 'loading' && 'Memeriksa koneksi backend...'}
              {health.status === 'ok' && 'Backend & Model Siap'}
              {health.status === 'error' && 'Backend Tidak Terhubung'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {health.status === 'loading' && 'Mohon tunggu sebentar'}
              {health.status === 'ok' && 'Model best.pt berhasil dimuat — sistem siap melakukan inferensi'}
              {health.status === 'error' && 'Pastikan backend FastAPI berjalan di port 8000'}
            </div>
          </div>
          {health.status !== 'loading' && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              health.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {health.status === 'ok' ? 'ONLINE' : 'OFFLINE'}
            </span>
          )}
        </div>

        {/* Model Cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Informasi Model</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {modelCards.map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-5">
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center mb-2 md:mb-3 ${c.color}`}>
                  <Icon name={c.icon} size={17} />
                </div>
                <div className="text-base md:text-lg font-bold text-[#111827] leading-tight">{c.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {/* Sesi ini */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-6 space-y-3 md:space-y-4">
            <h2 className="font-semibold text-[#111827] text-sm md:text-base">Statistik Sesi Ini</h2>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-0">
              <div className="flex justify-between items-center py-2 md:py-2.5 border-b border-[#F3F4F6]">
                <span className="text-xs md:text-sm text-gray-500">Gambar diproses</span>
                <span className="text-xs md:text-sm font-bold text-[#111827]">{session.detectionCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 md:py-2.5 border-b border-[#F3F4F6]">
                <span className="text-xs md:text-sm text-gray-500">Total objek</span>
                <span className="text-xs md:text-sm font-bold text-[#111827]">{session.totalObjects}</span>
              </div>
              <div className="flex justify-between items-center py-2 md:py-2.5 border-b border-[#F3F4F6] col-span-2 md:col-span-1">
                <span className="text-xs md:text-sm text-gray-500">Kelas terakhir</span>
                <span className="text-xs md:text-sm font-bold text-[#111827]">{session.lastClass}</span>
              </div>
              <div className="flex justify-between items-center py-2 md:py-2.5 col-span-2 md:col-span-1">
                <span className="text-xs md:text-sm text-gray-500">Terakhir deteksi</span>
                <span className="text-xs md:text-sm font-bold text-[#111827]">{session.lastTime}</span>
              </div>
            </div>
          </div>

          {/* Kelas Makanan */}
          <div className="md:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-6">
            <h2 className="font-semibold text-[#111827] mb-3 md:mb-4 text-sm md:text-base">Kelas Makanan Karbohidrat</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: 0, name: 'nasi_putih', color: 'bg-green-100 text-green-700' },
                { id: 1, name: 'nasi_merah', color: 'bg-red-100 text-red-700' },
                { id: 2, name: 'roti_utuh', color: 'bg-yellow-100 text-yellow-700' },
                { id: 3, name: 'roti_tawar', color: 'bg-orange-100 text-orange-700' },
                { id: 4, name: 'mi_pasta', color: 'bg-blue-100 text-blue-700' },
                { id: 5, name: 'kentang', color: 'bg-amber-100 text-amber-700' },
                { id: 6, name: 'jagung', color: 'bg-lime-100 text-lime-700' },
                { id: 7, name: 'pisang', color: 'bg-purple-100 text-purple-700' },
              ].map((fc) => (
                <div key={fc.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F9FAFB] border border-[#F3F4F6]">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${fc.color}`}>
                    {fc.id}
                  </span>
                  <span className="text-xs text-[#374151] font-medium truncate">{fc.name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/detect')}
              className="mt-4 md:mt-5 w-full h-10 bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="center_focus_strong" size={16} className="text-white" />
              Deteksi Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
