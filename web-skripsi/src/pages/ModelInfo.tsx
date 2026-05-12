import { useState, useEffect } from 'react'
import Icon from '../components/Icon'

const metrics = [
  { label: 'mAP@0.5', value: 0.921, display: '92.1%' },
  { label: 'mAP@0.5:0.95', value: 0.764, display: '76.4%' },
  { label: 'Precision', value: 0.887, display: '88.7%' },
  { label: 'Recall', value: 0.863, display: '86.3%' },
]

const foodClasses = [
  { id: 0, name: 'nasi_putih' },
  { id: 1, name: 'nasi_merah' },
  { id: 2, name: 'roti_utuh' },
  { id: 3, name: 'roti_tawar' },
  { id: 4, name: 'mi_pasta' },
  { id: 5, name: 'kentang' },
  { id: 6, name: 'jagung' },
  { id: 7, name: 'pisang' },
]

const specs = [
  { label: 'Arsitektur', value: 'YOLOv8n (Nano)' },
  { label: 'Dataset', value: 'Custom Indonesian Food' },
  { label: 'Epochs', value: '100 epochs' },
  { label: 'Input Size', value: '640 × 640 px' },
  { label: 'Model File', value: 'best.pt' },
  { label: 'Framework', value: 'Ultralytics YOLOv8' },
  { label: 'Device', value: 'CPU' },
  { label: 'Jumlah Kelas', value: '8 kelas' },
]

export default function ModelInfo() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 md:py-5 bg-white border-b border-[#E5E7EB] flex-shrink-0">
        <h1 className="text-[#111827] text-lg md:text-xl font-bold">Info Model</h1>
        <p className="text-gray-500 text-xs md:text-sm mt-0.5">Informasi lengkap mengenai model YOLOv8 yang digunakan</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-5">
        {/* Model Identity */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="bg-[#064E3B] px-4 md:px-6 py-4 md:py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-white text-base md:text-lg font-bold leading-tight">YOLOv8n — CarbFood Detector</h2>
                <p className="text-green-300 text-xs md:text-sm mt-1">best.pt • Nano Architecture</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-green-300 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Active
              </span>
            </div>
          </div>
          <div className="px-4 md:px-6 py-4 md:py-5 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {specs.map((s) => (
              <div key={s.label}>
                <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                <div className="text-sm font-semibold text-[#111827] mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance + Classes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-6">
            <h3 className="font-semibold text-[#111827] mb-4 md:mb-5 text-sm md:text-base">Performa Model</h3>
            <div className="space-y-4 md:space-y-5">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-1.5 md:mb-2">
                    <span className="font-medium text-[#374151]">{m.label}</span>
                    <span className="font-bold text-[#059669]">{m.display}</span>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#059669] rounded-full transition-all duration-700 ease-out"
                      style={{ width: mounted ? `${m.value * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 md:mt-5 p-3 bg-[#F0FDF4] rounded-lg border border-green-100">
              <p className="text-xs text-green-700 font-medium flex items-start gap-1.5">
                <Icon name="check_circle" size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
                Model divalidasi menggunakan 20% data validation set dari dataset custom Indonesian food.
              </p>
            </div>
          </div>

          {/* Food Classes */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-6">
            <h3 className="font-semibold text-[#111827] mb-4 md:mb-5 text-sm md:text-base">Daftar Kelas Makanan</h3>
            <div className="grid grid-cols-2 gap-2">
              {foodClasses.map((fc) => (
                <div key={fc.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F9FAFB]">
                  <span className="w-6 h-6 rounded-md bg-[#E5E7EB] text-gray-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {fc.id}
                  </span>
                  <span className="text-xs text-[#374151] font-medium truncate">{fc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
