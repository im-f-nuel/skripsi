import Icon from '../components/Icon'

const metrics = [
  { label: 'mAP@0.5', value: 0.921, display: '92.1%' },
  { label: 'mAP@0.5:0.95', value: 0.764, display: '76.4%' },
  { label: 'Precision', value: 0.887, display: '88.7%' },
  { label: 'Recall', value: 0.863, display: '86.3%' },
]

const foodClasses = [
  { id: 0, name: 'nasi_putih', color: 'bg-green-100 text-green-700' },
  { id: 1, name: 'nasi_merah', color: 'bg-red-100 text-red-700' },
  { id: 2, name: 'roti_utuh', color: 'bg-yellow-100 text-yellow-700' },
  { id: 3, name: 'roti_tawar', color: 'bg-orange-100 text-orange-700' },
  { id: 4, name: 'mi_pasta', color: 'bg-blue-100 text-blue-700' },
  { id: 5, name: 'kentang', color: 'bg-amber-100 text-amber-700' },
  { id: 6, name: 'jagung', color: 'bg-lime-100 text-lime-700' },
  { id: 7, name: 'pisang', color: 'bg-purple-100 text-purple-700' },
]

export default function ModelInfo() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-[#E5E7EB] flex-shrink-0">
        <h1 className="text-[#111827] text-xl font-bold">Info Model</h1>
        <p className="text-gray-500 text-sm mt-0.5">Informasi lengkap mengenai model YOLOv8 yang digunakan</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-5">
        {/* Model Identity */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="bg-[#064E3B] px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-lg font-bold">YOLOv8n — CarbFood Detector</h2>
                <p className="text-green-300 text-sm mt-1">best.pt • Nano Architecture</p>
              </div>
              <span className="px-3 py-1.5 bg-[#059669] text-white text-xs font-semibold rounded-full">Active</span>
            </div>
          </div>
          <div className="px-6 py-5 grid grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-gray-500 font-medium">Arsitektur</div>
              <div className="text-sm font-semibold text-[#111827] mt-1">YOLOv8n (Nano)</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Dataset</div>
              <div className="text-sm font-semibold text-[#111827] mt-1">Custom Indonesian Food</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Epochs</div>
              <div className="text-sm font-semibold text-[#111827] mt-1">100 epochs</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Input Size</div>
              <div className="text-sm font-semibold text-[#111827] mt-1">640 × 640 px</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Model File</div>
              <div className="text-sm font-semibold text-[#111827] mt-1">best.pt</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Framework</div>
              <div className="text-sm font-semibold text-[#111827] mt-1">Ultralytics YOLOv8</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Device</div>
              <div className="text-sm font-semibold text-[#111827] mt-1">CPU</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Jumlah Kelas</div>
              <div className="text-sm font-semibold text-[#111827] mt-1">8 kelas</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h3 className="font-semibold text-[#111827] mb-5">Performa Model</h3>
            <div className="space-y-5">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[#374151]">{m.label}</span>
                    <span className="font-bold text-[#059669]">{m.display}</span>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#059669] rounded-full transition-all"
                      style={{ width: `${m.value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 p-3 bg-[#F0FDF4] rounded-lg border border-green-100">
              <p className="text-xs text-green-700 font-medium flex items-start gap-1.5">
                <Icon name="check_circle" size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
                Model divalidasi menggunakan 20% data validation set dari dataset custom Indonesian food.
              </p>
            </div>
          </div>

          {/* Food Classes */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h3 className="font-semibold text-[#111827] mb-5">Daftar Kelas Makanan</h3>
            <div className="grid grid-cols-2 gap-2">
              {foodClasses.map((fc) => (
                <div key={fc.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F9FAFB]">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${fc.color}`}>
                    {fc.id}
                  </span>
                  <span className="text-sm text-[#374151] font-medium truncate">{fc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
