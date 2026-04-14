import { useState, useRef, useEffect } from 'react'
import Icon from '../components/Icon'
import { recordDetection } from '../lib/session'

const DISCRETE_CLASSES = ['pisang', 'kentang', 'jagung', 'roti_tawar', 'roti_utuh']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp']

interface Detection {
  class_id: number
  class_name: string
  confidence: number
  bbox: [number, number, number, number]
}

interface NutritionInfo {
  class_name: string
  nama: string
  kalori: number
  karbohidrat: number
  protein: number
  lemak: number
  serat: number
  sumber: string
  satuan: string
}

export default function DetectImage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [renderedImage, setRenderedImage] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nutritionMap, setNutritionMap] = useState<Record<string, NutritionInfo>>({})
  const [nutritionSource, setNutritionSource] = useState<'usda' | 'fatsecret'>('usda')
  const [fatsecretAvailable, setFatsecretAvailable] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/nutrition/sources')
      .then((r) => r.json())
      .then((data) => setFatsecretAvailable(data.fatsecret ?? false))
      .catch(() => setFatsecretAvailable(false))
  }, [])

  const handleFile = (f: File) => {
    if (f.size > MAX_FILE_SIZE) {
      setError(`Ukuran file melebihi batas maksimal 10 MB (ukuran file: ${(f.size / 1024 / 1024).toFixed(1)} MB)`)
      return
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError(`Format file tidak didukung. Gunakan JPG, PNG, BMP, TIFF, atau WebP`)
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setDetections([])
    setRenderedImage(null)
    setError(null)
    setNutritionMap({})
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleDetect = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const fd1 = new FormData()
      fd1.append('file', file)
      const jsonRes = await fetch(`/api/predict/image`, { method: 'POST', body: fd1 })
      if (!jsonRes.ok) throw new Error('Gagal mendapatkan prediksi')
      const data = await jsonRes.json()
      const dets: Detection[] = data.detections ?? []
      setDetections(dets)

      if (dets.length > 0) {
        const fd2 = new FormData()
        fd2.append('file', file)
        const renderRes = await fetch(`/api/predict/image-render`, { method: 'POST', body: fd2 })
        if (renderRes.ok) {
          const blob = await renderRes.blob()
          setRenderedImage(URL.createObjectURL(blob))
        }
        recordDetection([...new Set(dets.map((d) => d.class_name))], dets.length)

        // Fetch nutrisi untuk setiap unique class
        const uniqueClasses = [...new Set(dets.map((d) => d.class_name))]
        const nutritionResults = await Promise.all(
          uniqueClasses.map((cls) =>
            fetch(`/api/nutrition/${cls}?source=${nutritionSource}`).then((r) => (r.ok ? r.json() : null))
          )
        )
        const map: Record<string, NutritionInfo> = {}
        nutritionResults.forEach((data, i) => {
          if (data) map[uniqueClasses[i]] = data
        })
        setNutritionMap(map)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setRenderedImage(null)
    setDetections([])
    setError(null)
    setNutritionMap({})
  }

  const classCounts = detections.reduce((acc, d) => {
    acc[d.class_name] = (acc[d.class_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const uniqueClasses = Object.keys(classCounts)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-8 py-5 bg-white border-b border-[#E5E7EB] flex-shrink-0">
        <h1 className="text-[#111827] text-xl font-bold">Deteksi Gambar</h1>
        <p className="text-gray-500 text-sm mt-0.5">Upload gambar makanan untuk dianalisis menggunakan YOLOv8</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — upload + params */}
          <div className="space-y-4">
            {/* Upload zone */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <h3 className="font-semibold text-[#111827] mb-4 text-sm">Upload Gambar</h3>
              {!file ? (
                <div
                  className="border-2 border-dashed border-[#E5E7EB] rounded-xl py-12 flex flex-col items-center gap-3 cursor-pointer hover:border-[#059669] hover:bg-green-50/30 transition-colors"
                  onClick={() => inputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                    <Icon name="upload" size={28} className="text-[#059669]" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#111827]">Klik atau seret gambar ke sini</div>
                    <div className="text-xs text-gray-400 mt-1">JPG, JPEG, PNG · Maks. 10 MB</div>
                  </div>
                  <input ref={inputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <img src={preview!} alt="preview" className="w-full rounded-lg object-contain max-h-64 bg-[#F9FAFB]" />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-[#F9FAFB] rounded-lg">
                    <Icon name="image" size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400">
                      {file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Nutrition source */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <h3 className="font-semibold text-[#111827] text-sm mb-3">Sumber Data Nutrisi</h3>
              <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden text-xs font-semibold">
                <button
                  onClick={() => setNutritionSource('usda')}
                  className={`flex-1 py-2 transition-colors ${
                    nutritionSource === 'usda'
                      ? 'bg-[#059669] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  USDA
                </button>
                <button
                  onClick={() => setNutritionSource('fatsecret')}
                  disabled={fatsecretAvailable === false}
                  className={`flex-1 py-2 transition-colors ${
                    nutritionSource === 'fatsecret'
                      ? 'bg-[#059669] text-white'
                      : fatsecretAvailable === false
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  FatSecret
                </button>
              </div>
              {fatsecretAvailable === false && nutritionSource === 'fatsecret' && (
                <p className="text-[10px] text-amber-600 mt-1.5">
                  FatSecret tidak tersedia — gunakan USDA
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDetect}
                disabled={!file || loading}
                className="flex-1 h-11 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Icon name="center_focus_strong" size={17} className="text-white" />
                    Deteksi
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={!file}
                className="h-11 px-4 border border-[#E5E7EB] text-gray-500 hover:bg-gray-50 disabled:opacity-40 rounded-lg transition-colors"
              >
                <Icon name="refresh" size={17} />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <Icon name="error" size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Right — results */}
          <div className="space-y-4">
            {/* Rendered image */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#111827] text-sm">Hasil Visualisasi</h3>
                {renderedImage && (
                  <a
                    href={renderedImage}
                    download={`carbfood-result-${Date.now()}.jpg`}
                    className="flex items-center gap-1.5 text-xs text-[#059669] font-medium hover:underline"
                  >
                    <Icon name="download" size={14} />
                    Unduh
                  </a>
                )}
              </div>
              {renderedImage ? (
                <img src={renderedImage} alt="hasil deteksi" className="w-full rounded-lg object-contain max-h-64 bg-[#F9FAFB]" />
              ) : (
                <div className="py-14 flex flex-col items-center gap-2 text-gray-300">
                  <Icon name="photo_camera" size={40} />
                  <span className="text-sm text-gray-400">Gambar hasil akan tampil di sini</span>
                </div>
              )}
            </div>

            {/* Detection results */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#111827] text-sm">Hasil Deteksi</h3>
                {detections.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {detections.length} objek
                  </span>
                )}
              </div>
              {detections.length === 0 ? (
                <div className="py-8 text-center text-gray-300">
                  <Icon name="search_off" size={36} className="mx-auto mb-2" />
                  <div className="text-sm text-gray-400">
                    {loading ? 'Mendeteksi...' : 'Belum ada hasil'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Daftar deteksi individual */}
                  {detections.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg">
                      <span className="w-5 h-5 rounded bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#111827]">{d.class_name}</span>
                          <span className="text-xs font-bold text-[#059669]">{d.confidence.toFixed(4)} ({(d.confidence * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div className="h-full bg-[#059669] rounded-full" style={{ width: `${d.confidence * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Nutrisi per kelas unik — diskret dikalikan jumlah unit */}
                  {uniqueClasses.length > 0 && Object.keys(nutritionMap).length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Informasi Nutrisi</div>
                      {uniqueClasses.map((cls) => {
                        const nutrisi = nutritionMap[cls]
                        if (!nutrisi) return null
                        const count = classCounts[cls]
                        const isDiscrete = DISCRETE_CLASSES.includes(cls)
                        const mul = isDiscrete ? count : 1
                        const satuan = isDiscrete ? `${count} unit` : '1 porsi standar (per 100g)'
                        return (
                          <div key={cls} className="p-3 bg-green-50 rounded-lg border border-green-100 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-green-800">{nutrisi.nama}</p>
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{satuan}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-700 text-xs">
                              <span>Kalori</span>     <span className="font-medium">{(nutrisi.kalori * mul).toFixed(1)} kkal</span>
                              <span>Karbohidrat</span><span className="font-medium">{(nutrisi.karbohidrat * mul).toFixed(1)} g</span>
                              <span>Protein</span>    <span className="font-medium">{(nutrisi.protein * mul).toFixed(1)} g</span>
                              <span>Lemak</span>      <span className="font-medium">{(nutrisi.lemak * mul).toFixed(1)} g</span>
                              <span>Serat</span>      <span className="font-medium">{(nutrisi.serat * mul).toFixed(1)} g</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Sumber: {nutrisi.sumber}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
