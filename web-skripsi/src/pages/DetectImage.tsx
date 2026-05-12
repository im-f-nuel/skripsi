import { useState, useRef, useEffect } from 'react'
import Icon from '../components/Icon'
import { recordDetection } from '../lib/session'

const DISCRETE_CLASSES = ['pisang', 'kentang', 'jagung', 'roti_tawar', 'roti_utuh']
const MAX_FILE_SIZE = 10 * 1024 * 1024
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
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nutritionMap, setNutritionMap] = useState<Record<string, NutritionInfo>>({})
  const [nutritionSource, setNutritionSource] = useState<'usda' | 'fatsecret'>('usda')
  const [fatsecretAvailable, setFatsecretAvailable] = useState<boolean | null>(null)
  const [isDragging, setIsDragging] = useState(false)
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
      setError('Format file tidak didukung. Gunakan JPG, PNG, BMP, TIFF, atau WebP')
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
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleDetect = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setNutritionMap({})
    let dets: Detection[] = []

    try {
      const fd1 = new FormData()
      fd1.append('file', file)
      const jsonRes = await fetch('/api/predict/image', { method: 'POST', body: fd1 })
      if (!jsonRes.ok) throw new Error('Gagal mendapatkan prediksi')
      const data = await jsonRes.json()
      dets = data.detections ?? []
      setDetections(dets)

      if (dets.length > 0) {
        const fd2 = new FormData()
        fd2.append('file', file)
        const renderRes = await fetch('/api/predict/image-render', { method: 'POST', body: fd2 })
        if (renderRes.ok) {
          const blob = await renderRes.blob()
          setRenderedImage(URL.createObjectURL(blob))
        }
        recordDetection([...new Set(dets.map((d) => d.class_name))], dets.length)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setLoading(false)
      return
    }

    setLoading(false)

    if (dets.length > 0) {
      setNutritionLoading(true)
      try {
        const uniqueClasses = [...new Set(dets.map((d) => d.class_name))]
        const results = await Promise.all(
          uniqueClasses.map((cls) =>
            fetch(`/api/nutrition/${cls}?source=${nutritionSource}`).then((r) => (r.ok ? r.json() : null))
          )
        )
        const map: Record<string, NutritionInfo> = {}
        results.forEach((d, i) => { if (d) map[uniqueClasses[i]] = d })
        setNutritionMap(map)
      } catch {
        // nutrition failure is non-critical
      } finally {
        setNutritionLoading(false)
      }
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
                  className={`border-2 border-dashed rounded-xl py-12 flex flex-col items-center gap-2.5 cursor-pointer transition-colors ${
                    isDragging ? 'border-[#059669] bg-green-50/40' : 'border-[#E5E7EB] hover:border-[#059669]'
                  }`}
                  onClick={() => inputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                >
                  <Icon
                    name="upload_file"
                    size={36}
                    className={isDragging ? 'text-[#059669]' : 'text-gray-300'}
                  />
                  <div className="text-center">
                    <div className={`text-sm font-semibold transition-colors ${isDragging ? 'text-[#059669]' : 'text-[#374151]'}`}>
                      {isDragging ? 'Lepaskan untuk upload' : 'Klik atau seret gambar ke sini'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">JPG, JPEG, PNG · Maks. 10 MB</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => inputRef.current?.click()}
                  >
                    <img
                      src={preview!}
                      alt="preview"
                      className="w-full rounded-lg object-contain max-h-64 bg-[#F9FAFB]"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium flex items-center gap-1.5">
                        <Icon name="photo_camera" size={14} className="text-white" />
                        Klik untuk ganti
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-[#F9FAFB] rounded-lg">
                    <Icon name="image" size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400">
                      {file.size < 1024 * 1024
                        ? `${(file.size / 1024).toFixed(1)} KB`
                        : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                    </span>
                  </div>
                </div>
              )}

              {/* Single input always mounted */}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {/* Nutrition source */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#111827] text-sm">Sumber Data Nutrisi</h3>
                {fatsecretAvailable === false && (
                  <span className="text-[10px] text-gray-400">FatSecret tidak dikonfigurasi</span>
                )}
              </div>
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
                  onClick={() => fatsecretAvailable !== false && setNutritionSource('fatsecret')}
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
                className="h-11 px-4 border border-[#E5E7EB] text-gray-500 hover:bg-gray-50 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Icon name="close" size={15} />
                <span className="text-xs font-medium">Hapus</span>
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
          {!file && detections.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] flex flex-col items-center justify-center text-center p-10 min-h-[320px]">
              <Icon name="image_search" size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-[#374151] mb-1.5">Hasil deteksi akan tampil di sini</p>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[260px]">
                Upload gambar di panel kiri, lalu klik{' '}
                <span className="font-semibold text-[#374151]">Deteksi</span> — visualisasi bounding box
                dan informasi nutrisi akan muncul di sini.
              </p>
            </div>
          ) : (
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
                  <img
                    src={renderedImage}
                    alt="hasil deteksi"
                    className="w-full rounded-lg object-contain max-h-80 bg-[#F9FAFB]"
                  />
                ) : (
                  <div className="py-14 flex flex-col items-center gap-2">
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#059669] rounded-full animate-spin" />
                    ) : (
                      <Icon name="photo_camera" size={40} className="text-gray-200" />
                    )}
                    <span className="text-sm text-gray-400">
                      {loading ? 'Memproses gambar...' : 'Gambar hasil akan tampil di sini'}
                    </span>
                  </div>
                )}
              </div>

              {/* Detection results */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#111827] text-sm">Hasil Deteksi</h3>
                  {detections.length > 0 && (
                    <span className="text-xs text-gray-400 font-medium">{detections.length} objek terdeteksi</span>
                  )}
                </div>

                {detections.length === 0 ? (
                  <div className="py-8 text-center">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-[#059669] rounded-full animate-spin mx-auto mb-2" />
                    ) : (
                      <Icon name="search_off" size={36} className="text-gray-200 mx-auto mb-2" />
                    )}
                    <div className="text-sm text-gray-400">
                      {loading ? 'Mendeteksi...' : 'Belum ada hasil'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detections.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg">
                        <span className="w-5 h-5 rounded bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#111827]">{d.class_name}</span>
                            <span className="text-xs font-bold text-[#059669]">{(d.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="mt-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#059669] rounded-full"
                              style={{ width: `${d.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Nutrisi */}
                    {uniqueClasses.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 flex items-center gap-2">
                          Informasi Nutrisi
                          {nutritionLoading && (
                            <div className="w-3 h-3 border border-gray-300 border-t-[#059669] rounded-full animate-spin" />
                          )}
                        </div>

                        {nutritionLoading ? (
                          // Skeleton loader
                          <div className="space-y-2">
                            {uniqueClasses.map((cls) => (
                              <div key={cls} className="rounded-lg border border-[#E5E7EB] overflow-hidden animate-pulse">
                                <div className="px-3 py-2 border-b border-[#F3F4F6] flex items-center justify-between">
                                  <div className="h-3 w-28 bg-gray-100 rounded" />
                                  <div className="h-2.5 w-16 bg-gray-100 rounded" />
                                </div>
                                <div className="px-3 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <>
                                      <div key={`l${n}`} className="h-2.5 w-20 bg-gray-100 rounded" />
                                      <div key={`v${n}`} className="h-2.5 w-14 bg-gray-100 rounded" />
                                    </>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          Object.keys(nutritionMap).length > 0 && uniqueClasses.map((cls) => {
                            const nutrisi = nutritionMap[cls]
                            if (!nutrisi) return null
                            const count = classCounts[cls]
                            const isDiscrete = DISCRETE_CLASSES.includes(cls)
                            const mul = isDiscrete ? count : 1
                            const satuan = isDiscrete ? `${count} unit` : '1 porsi standar (per 100g)'
                            return (
                              <div key={cls} className="rounded-lg border border-[#E5E7EB] overflow-hidden">
                                <div className="px-3 py-2 border-b border-[#F3F4F6] flex items-center justify-between">
                                  <span className="text-xs font-semibold text-[#111827]">{nutrisi.nama}</span>
                                  <span className="text-[10px] text-gray-400">{satuan}</span>
                                </div>
                                <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                  <span className="text-gray-500">Kalori</span>
                                  <span className="font-semibold text-[#111827]">{(nutrisi.kalori * mul).toFixed(1)} kkal</span>
                                  <span className="text-gray-500">Karbohidrat</span>
                                  <span className="font-semibold text-[#111827]">{(nutrisi.karbohidrat * mul).toFixed(1)} g</span>
                                  <span className="text-gray-500">Protein</span>
                                  <span className="font-semibold text-[#111827]">{(nutrisi.protein * mul).toFixed(1)} g</span>
                                  <span className="text-gray-500">Lemak</span>
                                  <span className="font-semibold text-[#111827]">{(nutrisi.lemak * mul).toFixed(1)} g</span>
                                  <span className="text-gray-500">Serat</span>
                                  <span className="font-semibold text-[#111827]">{(nutrisi.serat * mul).toFixed(1)} g</span>
                                </div>
                                <div className="px-3 py-1.5 border-t border-[#F3F4F6] bg-[#F9FAFB]">
                                  <span className="text-[10px] text-gray-400">Sumber: {nutrisi.sumber}</span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
