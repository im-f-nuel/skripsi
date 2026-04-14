import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { login, loginDemo } from '../lib/auth'
import { seedDemoHistory } from '../lib/history'

const features = [
  { icon: 'model_training', title: 'YOLOv8 Model', desc: 'Nano Architecture' },
  { icon: 'restaurant', title: '8 Kelas', desc: 'Makanan Karbohidrat' },
  { icon: 'bolt', title: 'Deteksi Cepat', desc: 'Di bawah 3 detik' },
]

export default function Login() {
  const [email, setEmail] = useState('admin@carbfood.id')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const user = login(email, password, remember)
    if (!user) {
      setError('Email atau password salah.')
      setLoading(false)
      return
    }
    navigate('/', { replace: true })
  }

  const handleDemo = () => {
    loginDemo(false)
    seedDemoHistory()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex h-full font-primary">
      {/* Left Panel */}
      <div className="relative w-1/2 flex-shrink-0 bg-[#111827] flex flex-col overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80')" }}
        />
        <div className="absolute inset-0 bg-[#111827]/75" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#059669] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              C
            </div>
            <span className="text-white font-bold text-xl">CarbFood</span>
          </div>

          <div className="flex-1" />

          {/* Hero */}
          <div className="space-y-4 mb-10">
            <h1 className="text-white text-4xl font-bold leading-tight">
              Deteksi Makanan<br />Berbasis AI
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Identifikasi kandungan karbohidrat pada makanan secara otomatis menggunakan model YOLOv8 yang terlatih.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            <div>
              <div className="text-[#34D399] text-2xl font-bold">8</div>
              <div className="text-gray-400 text-xs mt-1">Kelas Makanan</div>
            </div>
            <div>
              <div className="text-[#34D399] text-2xl font-bold">95%+</div>
              <div className="text-gray-400 text-xs mt-1">Akurasi Model</div>
            </div>
            <div>
              <div className="text-[#34D399] text-2xl font-bold">&lt;3s</div>
              <div className="text-gray-400 text-xs mt-1">Waktu Inferensi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-white overflow-y-auto py-10">
        <div className="w-full max-w-[480px] px-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[#111827] text-[28px] font-bold">Selamat Datang</h2>
            <p className="text-gray-500 text-sm mt-1">Masuk ke dashboard CarbFood Detector</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[#374151] text-[13px] font-semibold block">Email</label>
              <div className={`flex items-center gap-2.5 h-11 px-3.5 rounded-lg bg-[#F9FAFB] border transition-colors ${error ? 'border-red-300' : 'border-[#E5E7EB] focus-within:border-[#059669]'}`}>
                <Icon name="mail" size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  placeholder="admin@carbfood.id"
                  className="flex-1 bg-transparent text-sm text-[#374151] placeholder-gray-400 outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#374151] text-[13px] font-semibold">Password</label>
                <button type="button" className="text-[#059669] text-xs font-medium hover:underline">
                  Lupa Password?
                </button>
              </div>
              <div className={`flex items-center gap-2.5 h-11 px-3.5 rounded-lg bg-[#F9FAFB] border transition-colors ${error ? 'border-red-300' : 'border-[#E5E7EB] focus-within:border-[#059669]'}`}>
                <Icon name="lock" size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  placeholder="Masukkan password"
                  className="flex-1 bg-transparent text-sm text-[#374151] outline-none"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={16} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                <Icon name="error" size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Remember */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${remember ? 'bg-[#059669] border-[#059669]' : 'border-gray-300 bg-white'}`}
              >
                {remember && <Icon name="check" size={11} className="text-white" />}
              </button>
              <span className="text-[#374151] text-[13px] cursor-pointer select-none" onClick={() => setRemember(!remember)}>
                Ingat saya
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#059669] hover:bg-[#047857] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-[15px] rounded-lg transition-colors"
            >
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E5E7EB]" />
              <span className="text-gray-400 text-xs">atau</span>
              <div className="flex-1 h-px bg-[#E5E7EB]" />
            </div>

            <button
              type="button"
              onClick={handleDemo}
              className="w-full h-11 bg-[#F9FAFB] hover:bg-gray-100 border border-[#E5E7EB] text-[#374151] font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="play_circle" size={16} className="text-gray-500" />
              Masuk sebagai Demo
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-500 text-[13px] mt-6">
            Belum punya akun?{' '}
            <span className="text-[#059669] font-semibold cursor-pointer hover:underline">Hubungi Admin</span>
          </p>

          {/* Feature Highlights */}
          <div className="mt-10 pt-8 border-t border-[#F3F4F6]">
            <p className="text-center text-gray-400 text-xs mb-5">Didukung oleh teknologi terkini</p>
            <div className="grid grid-cols-3 gap-4">
              {features.map((f) => (
                <div key={f.title} className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto">
                    <Icon name={f.icon} size={20} className="text-[#059669]" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#111827]">{f.title}</div>
                    <div className="text-[11px] text-gray-400">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
