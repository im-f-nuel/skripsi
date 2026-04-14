import { useState } from 'react'
import Icon from '../components/Icon'
import { getSettings, saveSettings } from '../lib/settings'
import { clearHistory } from '../lib/history'
import { getUser } from '../lib/auth'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#059669]' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SectionCard({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F3F4F6]">
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
          <Icon name={icon} size={16} className="text-[#059669]" />
        </div>
        <div>
          <h3 className="font-semibold text-[#111827] text-sm">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

export default function Settings() {
  const initial = getSettings()
  const user = getUser()
  const [conf, setConf] = useState(initial.conf)
  const [iou, setIou] = useState(initial.iou)
  const [maxSize, setMaxSize] = useState(initial.maxSize)
  const [arch, setArch] = useState(initial.arch)
  const [device, setDevice] = useState(initial.device)
  const [modelPath, setModelPath] = useState(initial.modelPath)
  const [autoSave, setAutoSave] = useState(initial.autoSave)
  const [maxHistory, setMaxHistory] = useState(initial.maxHistory)
  const [theme, setTheme] = useState(initial.theme)
  const [language, setLanguage] = useState(initial.language)
  const [confidenceFormat, setConfidenceFormat] = useState(initial.confidenceFormat)
  const [notifDetect, setNotifDetect] = useState(initial.notifDetect)
  const [notifAlert, setNotifAlert] = useState(initial.notifAlert)
  const [alertThreshold, setAlertThreshold] = useState(initial.alertThreshold)
  const [saved, setSaved] = useState(false)
  const [historyCleared, setHistoryCleared] = useState(false)

  const handleSave = () => {
    saveSettings({
      conf, iou, maxSize, arch, device, modelPath,
      autoSave, maxHistory, theme, language, confidenceFormat,
      notifDetect, notifAlert, alertThreshold,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistoryCleared(true)
    setTimeout(() => setHistoryCleared(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[#111827] text-xl font-bold">Pengaturan</h1>
          <p className="text-gray-500 text-sm mt-0.5">Konfigurasi deteksi, parameter deteksi, tampilan dan profil pengguna</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${saved ? 'bg-green-100 text-green-700' : 'bg-[#059669] hover:bg-[#047857] text-white'}`}
        >
          <Icon name={saved ? 'check_circle' : 'save'} size={16} className={saved ? 'text-green-700' : 'text-white'} />
          {saved ? 'Tersimpan' : 'Simpan Perubahan'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-5">
          {/* Left Column */}
          <div className="space-y-5">
            <SectionCard title="Parameter Deteksi Default" subtitle="Nilai default saat membuka halaman deteksi" icon="tune">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-600">Confidence Threshold</span>
                  <span className="font-bold text-[#059669]">{conf.toFixed(2)}</span>
                </div>
                <input type="range" min={0.05} max={0.95} step={0.05} value={conf}
                  onChange={(e) => setConf(Number(e.target.value))} className="w-full accent-[#059669]" />
                <div className="flex justify-between text-[10px] text-gray-400"><span>0.05</span><span>0.95</span></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-600">IoU Threshold (NMS)</span>
                  <span className="font-bold text-[#059669]">{iou.toFixed(2)}</span>
                </div>
                <input type="range" min={0.1} max={0.9} step={0.05} value={iou}
                  onChange={(e) => setIou(Number(e.target.value))} className="w-full accent-[#059669]" />
                <div className="flex justify-between text-[10px] text-gray-400"><span>0.10</span><span>0.90</span></div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Ukuran Gambar Maksimum (MB)</label>
                <input type="number" value={maxSize} min={1} max={50}
                  onChange={(e) => setMaxSize(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] outline-none focus:border-[#059669]" />
              </div>
            </SectionCard>

            <SectionCard title="Konfigurasi Model" subtitle="Pengaturan model YOLOv8 yang digunakan" icon="smart_toy">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Path File Model</label>
                <input type="text" value={modelPath} onChange={(e) => setModelPath(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm font-mono text-[#374151] outline-none focus:border-[#059669]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Arsitektur Model</label>
                <div className="flex gap-2">
                  {(['n', 's', 'm'] as const).map((a) => (
                    <button key={a} onClick={() => setArch(a)}
                      className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${arch === a ? 'bg-[#059669] text-white' : 'bg-[#F3F4F6] text-gray-500 hover:bg-gray-200'}`}>
                      YOLOv8{a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Device Inferensi</label>
                <div className="flex gap-2">
                  {(['cpu', 'gpu'] as const).map((d) => (
                    <button key={d} onClick={() => setDevice(d)}
                      className={`flex-1 h-9 rounded-lg text-sm font-semibold uppercase transition-colors ${device === d ? 'bg-[#059669] text-white' : 'bg-[#F3F4F6] text-gray-500 hover:bg-gray-200'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <SectionCard title="Penyimpanan & Riwayat" subtitle="Pengaturan penyimpanan data deteksi" icon="save">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[#374151]">Auto-simpan Hasil Deteksi</div>
                  <div className="text-xs text-gray-400 mt-0.5">Simpan otomatis ke riwayat setelah deteksi</div>
                </div>
                <Toggle value={autoSave} onChange={setAutoSave} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Batas Riwayat (entri)</label>
                <input type="number" value={maxHistory} min={50} max={5000} step={50}
                  onChange={(e) => setMaxHistory(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] outline-none focus:border-[#059669]" />
              </div>
              <button
                onClick={handleClearHistory}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${historyCleared ? 'text-green-600' : 'text-red-500 hover:text-red-600'}`}
              >
                <Icon name={historyCleared ? 'check_circle' : 'delete'} size={15} className={historyCleared ? 'text-green-500' : 'text-red-400'} />
                {historyCleared ? 'Riwayat berhasil dihapus' : 'Hapus Semua Riwayat'}
              </button>
            </SectionCard>

            <SectionCard title="Tampilan" subtitle="Konfigurasi tema dan bahasa antarmuka" icon="palette">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Tema Antarmuka</label>
                <div className="flex gap-2">
                  {(['light', 'dark'] as const).map((t) => (
                    <button key={t} onClick={() => setTheme(t)}
                      className={`flex-1 h-9 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${theme === t ? 'bg-[#059669] text-white' : 'bg-[#F3F4F6] text-gray-500 hover:bg-gray-200'}`}>
                      <Icon name={t === 'light' ? 'light_mode' : 'dark_mode'} size={15} />
                      {t === 'light' ? 'Light' : 'Dark'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Bahasa Antarmuka</label>
                <div className="flex gap-2">
                  {(['id', 'en'] as const).map((l) => (
                    <button key={l} onClick={() => setLanguage(l)}
                      className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${language === l ? 'bg-[#059669] text-white' : 'bg-[#F3F4F6] text-gray-500 hover:bg-gray-200'}`}>
                      {l === 'id' ? 'Indonesia' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Format Confidence</label>
                <select
                  value={confidenceFormat}
                  onChange={(e) => setConfidenceFormat(e.target.value as 'percent' | 'decimal')}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] outline-none focus:border-[#059669]"
                >
                  <option value="percent">Persentase (94.2%)</option>
                  <option value="decimal">Desimal (0.942)</option>
                </select>
              </div>
            </SectionCard>

            <SectionCard title="Notifikasi" subtitle="Pengaturan notifikasi dan peringatan sistem" icon="notifications">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[#374151]">Notifikasi Deteksi Selesai</div>
                  <div className="text-xs text-gray-400 mt-0.5">Tampilkan notifikasi saat deteksi berhasil</div>
                </div>
                <Toggle value={notifDetect} onChange={setNotifDetect} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[#374151]">Alert Confidence Rendah</div>
                  <div className="text-xs text-gray-400 mt-0.5">Peringatan jika confidence di bawah ambang batas</div>
                </div>
                <Toggle value={notifAlert} onChange={setNotifAlert} />
              </div>
              {notifAlert && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-gray-600">Ambang Batas Alert</span>
                    <span className="font-bold text-[#059669]">{alertThreshold.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.1} max={0.9} step={0.05} value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))} className="w-full accent-[#059669]" />
                </div>
              )}
            </SectionCard>

            <SectionCard title="Profil Pengguna" subtitle="Informasi akun yang sedang aktif" icon="person">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#059669] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#111827]">{user?.name ?? '—'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{user?.email ?? '—'}</div>
                  <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${user?.role === 'demo' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {user?.role === 'demo' ? 'Demo' : 'Admin'}
                  </span>
                </div>
              </div>
              {user?.role !== 'demo' && (
                <div className="border-t border-[#E5E7EB] pt-4 space-y-2">
                  <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Icon name="lock" size={13} className="text-gray-400" />
                    GANTI PASSWORD
                  </div>
                  <input type="password" placeholder="Password saat ini"
                    className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] outline-none focus:border-[#059669]" />
                  <input type="password" placeholder="Password baru"
                    className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#374151] outline-none focus:border-[#059669]" />
                  <button className="w-full h-10 bg-[#111827] hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors">
                    Perbarui Password
                  </button>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
