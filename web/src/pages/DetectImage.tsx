import { useState, useRef } from 'react'
import Icon from '../components/Icon'
import { saveDetection } from '../lib/history'
import { getSettings } from '../lib/settings'

const settings = getSettings()

interface Detection {
  class_id: number
  class_name: string
  confidence: number
  bbox: number[]
}

export default function DetectImage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conf, setConf] = useState(() => getSettings().conf)
  const [iou, setIou] = useState(() => getSettings().iou)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setRenderedUrl(null)
    setDetections([])
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleDetect = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const fd1 = new FormData()
      fd1.append('file', file)
      const jsonRes = await fetch(`/api/predict/image?conf=${conf}&iou=${iou}`, { method: 'POST', body: fd1 })
      if (!jsonRes.ok) throw new Error('Gagal mendapatkan prediksi')
      const data = await jsonRes.json()
      const dets: Detection[] = data.detections ?? []
      setDetections(dets)

      if (dets.length > 0 && settings.autoSave) {
        const uniqueClasses = [...new Set(dets.map((d) => d.class_name))]
        const avgConf = dets.reduce((sum, d) => sum + d.confidence, 0) / dets.length
        saveDetection(
          {
            id: crypto.randomUUID(),
            filename: file.name,
            classes: uniqueClasses,
            confidence: Math.round(avgConf * 1000) / 10,
            objects: dets.length,
            time: new Date().toLocaleString('id-ID', { hour12: false }).replace(',', ''),
            size: file.size < 1024 * 1024
              ? `${(file.size / 1024).toFixed(1)} KB`
              : `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          },
          settings.maxHistory,
        )
      }

      const fd2 = new FormData()
      fd2.append('file', file)
      const imgRes = await fetch(`/api/predict/image-render?conf=${conf}&iou=${iou}`, { method: 'POST', body: fd2 })
      if (!imgRes.ok) throw new Error('Gagal mendapatkan gambar render')
      setRenderedUrl(URL.createObjectURL(await imgRes.blob()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreviewUrl(null)
    setRenderedUrl(null)
    setDetections([])
    setError(null)
  }

  const displayImage = renderedUrl || previewUrl

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-[#E5E7EB] flex-shrink-0">
        <h1 className="text-[#111827] text-xl font-bold">Deteksi Gambar</h1>
        <p className="text-gray-500 text-sm mt-0.5">Upload gambar makanan untuk dianalisis kandungan karbohidratnya</p>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Upload + Params */}
        <div className="w-[340px] flex-shrink-0 border-r border-[#E5E7EB] bg-white overflow-y-auto p-6 space-y-5">
          {/* Upload zone */}
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Upload Gambar</h3>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragging ? 'border-[#059669] bg-green-50' : 'border-[#E5E7EB] hover:border-[#059669]'}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-1">
                  <Icon name="image" size={32} className="text-[#059669] mx-auto" />
                  <div className="text-sm font-medium text-[#111827] truncate">{file.name}</div>
                  <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Icon name="upload" size={36} className="text-gray-300 mx-auto" />
                  <div className="text-sm font-medium text-[#374151]">Seret gambar ke sini</div>
                  <div className="text-xs text-gray-400">atau klik untuk memilih</div>
                  <div className="text-[11px] text-gray-300">JPG, PNG, JPEG • Maks 10MB</div>
                </div>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#111827]">Parameter Deteksi</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 font-medium">Confidence Threshold</span>
                <span className="text-[#059669] font-semibold">{conf.toFixed(2)}</span>
              </div>
              <input type="range" min={0.05} max={0.95} step={0.05} value={conf}
                onChange={(e) => setConf(Number(e.target.value))}
                className="w-full accent-[#059669]" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 font-medium">IoU Threshold (NMS)</span>
                <span className="text-[#059669] font-semibold">{iou.toFixed(2)}</span>
              </div>
              <input type="range" min={0.1} max={0.9} step={0.05} value={iou}
                onChange={(e) => setIou(Number(e.target.value))}
                className="w-full accent-[#059669]" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-600 text-xs">
              <Icon name="error" size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleDetect}
              disabled={!file || loading}
              className="w-full h-11 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mendeteksi...
                </>
              ) : (
                <>
                  <Icon name="center_focus_strong" size={16} className="text-white" />
                  Deteksi Sekarang
                </>
              )}
            </button>
            {file && (
              <button onClick={handleReset}
                className="w-full h-10 border border-[#E5E7EB] text-[#374151] text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Icon name="refresh" size={15} className="text-gray-400" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right: Preview + Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Image Preview */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">
                {renderedUrl ? 'Hasil Deteksi' : 'Preview Gambar'}
              </h3>
              {renderedUrl && (
                <a href={renderedUrl} download="detection-result.jpg"
                  className="flex items-center gap-1 text-xs text-[#059669] font-medium hover:underline">
                  <Icon name="download" size={14} />
                  Unduh Hasil
                </a>
              )}
            </div>
            <div className="flex items-center justify-center bg-[#F3F4F6] min-h-[280px]">
              {displayImage ? (
                <img src={displayImage} alt="Preview" className="max-h-[360px] max-w-full object-contain" />
              ) : (
                <div className="text-center text-gray-400 space-y-2 py-16">
                  <Icon name="image" size={48} className="text-gray-300 mx-auto" />
                  <div className="text-sm">Belum ada gambar yang dipilih</div>
                </div>
              )}
            </div>
          </div>

          {/* Detections List */}
          {detections.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
                <h3 className="text-sm font-semibold text-[#111827]">Hasil Deteksi</h3>
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                  {detections.length} objek
                </span>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {detections.map((d, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <span className="w-5 h-5 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-[#111827]">{d.class_name}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div className="h-full bg-[#059669] rounded-full" style={{ width: `${d.confidence * 100}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-[#111827] w-10 text-right">
                        {(d.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!file && !loading && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center text-gray-400 space-y-2">
              <Icon name="photo_camera" size={48} className="text-gray-300 mx-auto" />
              <div className="text-sm font-medium">Upload gambar untuk memulai deteksi</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
