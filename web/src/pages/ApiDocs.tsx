import Icon from '../components/Icon'

// Base URL dinamis berdasarkan host yang sedang diakses
const getBaseUrl = () => `http://${window.location.hostname}:8000`

const endpoints = [
  {
    method: 'GET',
    path: '/health',
    methodColor: 'bg-blue-100 text-blue-700',
    description: 'Health check untuk memverifikasi status server dan model yang sedang berjalan.',
    params: [],
    response: `{\n  "status": "ok",\n  "model": "best.pt"\n}`,
  },
  {
    method: 'POST',
    path: '/predict/image',
    methodColor: 'bg-green-100 text-green-700',
    description: 'Upload gambar dan dapatkan hasil deteksi dalam format JSON beserta bounding box.',
    params: [
      { name: 'file', type: 'File', desc: 'File gambar (multipart/form-data)' },
      { name: 'conf', type: 'float', desc: 'Confidence threshold (default: 0.25)' },
      { name: 'iou', type: 'float', desc: 'IoU threshold NMS (default: 0.45)' },
    ],
    response: `{\n  "detections": [\n    {\n      "class_id": 0,\n      "class_name": "nasi_putih",\n      "confidence": 0.921,\n      "bbox": [120.5, 80.2, 380.1, 290.4]\n    }\n  ]\n}`,
  },
  {
    method: 'POST',
    path: '/predict/image-render',
    methodColor: 'bg-green-100 text-green-700',
    description: 'Upload gambar dan dapatkan gambar JPEG dengan bounding box yang sudah dirender.',
    params: [
      { name: 'file', type: 'File', desc: 'File gambar (multipart/form-data)' },
      { name: 'conf', type: 'float', desc: 'Confidence threshold (default: 0.25)' },
      { name: 'iou', type: 'float', desc: 'IoU threshold NMS (default: 0.45)' },
    ],
    response: `Content-Type: image/jpeg\n\n[Binary JPEG image dengan bounding\n box overlay hasil deteksi]`,
  },
]

export default function ApiDocs() {
  const baseUrl = getBaseUrl()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-[#E5E7EB] flex-shrink-0">
        <h1 className="text-[#111827] text-xl font-bold">Endpoint API</h1>
        <p className="text-gray-500 text-sm mt-0.5">Dokumentasi REST API CarbFood Detector</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-5">
        {/* Base URL */}
        <div className="bg-[#111827] rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Base URL</div>
            <code className="text-[#34D399] text-base font-mono">{baseUrl}</code>
          </div>
          <a
            href={`${baseUrl}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Swagger UI
            <Icon name="open_in_new" size={14} className="text-white" />
          </a>
        </div>

        {/* Endpoints */}
        {endpoints.map((ep) => (
          <div key={ep.path} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E5E7EB]">
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${ep.methodColor}`}>{ep.method}</span>
              <code className="text-sm font-mono font-semibold text-[#111827]">{ep.path}</code>
              <span className="ml-auto px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">200 OK</span>
            </div>

            <div className="grid grid-cols-3 gap-0 divide-x divide-[#F3F4F6]">
              <div className="p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deskripsi</div>
                <p className="text-sm text-[#374151] leading-relaxed">{ep.description}</p>
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Parameter</div>
                {ep.params.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Tidak ada parameter</p>
                ) : (
                  <div className="space-y-3">
                    {ep.params.map((p) => (
                      <div key={p.name}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <code className="text-xs font-mono font-semibold text-[#059669]">{p.name}</code>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">{p.type}</span>
                        </div>
                        <div className="text-xs text-gray-500">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Response</div>
                <pre className="text-xs font-mono bg-[#F9FAFB] rounded-lg p-3 text-[#374151] overflow-x-auto leading-relaxed">{ep.response}</pre>
              </div>
            </div>
          </div>
        ))}

        {/* Note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Icon name="info" size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 text-sm font-semibold mb-1">Catatan Penggunaan</p>
              <ul className="text-blue-600 text-xs space-y-1 leading-relaxed list-disc list-inside">
                <li>Format gambar yang didukung: JPG, JPEG, PNG</li>
                <li>Ukuran file maksimum: 10 MB</li>
                <li>Nilai <code className="font-mono">conf</code> antara 0.0 – 1.0 (semakin tinggi = lebih selektif)</li>
                <li>Nilai <code className="font-mono">iou</code> antara 0.0 – 1.0 (mengontrol Non-Maximum Suppression)</li>
                <li>Pastikan backend berjalan di port 8000 sebelum menggunakan API</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
