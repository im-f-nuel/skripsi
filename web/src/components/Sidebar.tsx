import { NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { getUser, logout } from '../lib/auth'

const navItems = [
  {
    section: 'MENU',
    items: [
      { label: 'Dashboard', path: '/', icon: 'dashboard' },
      { label: 'Deteksi Gambar', path: '/detect', icon: 'photo_camera' },
      { label: 'Riwayat', path: '/history', icon: 'history' },
      { label: 'Info Model', path: '/model', icon: 'model_training' },
      { label: 'Endpoint API', path: '/api-docs', icon: 'api' },
    ],
  },
  {
    section: 'SISTEM',
    items: [
      { label: 'Pengaturan', path: '/settings', icon: 'settings' },
    ],
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const user = getUser()
  const isDemo = user?.role === 'demo'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'U'

  return (
    <aside className="w-[240px] h-full bg-[#111827] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          C
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm leading-tight">CarbFood</div>
          <div className="text-gray-400 text-[10px]">Detector v1.0</div>
        </div>
        {isDemo && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30 flex-shrink-0">
            DEMO
          </span>
        )}
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Icon name="info" size={13} className="text-amber-400 flex-shrink-0" />
            <p className="text-amber-400 text-[10px] leading-tight">Mode Demo aktif. Data menggunakan contoh.</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section}>
            <p className="text-gray-500 text-[10px] font-semibold tracking-wider px-3 mb-2">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-[#059669] text-white font-medium'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon name={item.icon} size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Card */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-[#059669] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name ?? 'User'}</p>
            <p className="text-gray-400 text-[11px] truncate">
              {isDemo ? 'Mode Demo' : 'Researcher'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-white transition-colors"
            title="Keluar"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
