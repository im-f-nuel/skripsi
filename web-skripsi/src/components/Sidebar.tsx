import { NavLink } from 'react-router-dom'
import Icon from './Icon'

const navItems = [
  { label: 'Beranda', path: '/', icon: 'dashboard' },
  { label: 'Deteksi Gambar', path: '/detect', icon: 'photo_camera' },
  { label: 'Info Model', path: '/model', icon: 'model_training' },
  { label: 'Endpoint API', path: '/api-docs', icon: 'api' },
]

export default function Sidebar() {
  return (
    <aside className="w-[240px] h-full bg-[#111827] hidden md:flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          C
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">CarbFood</div>
          <div className="text-gray-400 text-[10px]">Detector v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-gray-500 text-[10px] font-semibold tracking-wider px-3 mb-2">MENU</p>
        <ul className="space-y-1">
          {navItems.map((item) => (
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
      </nav>

      {/* Footer */}
      <div className="px-5 pb-5">
        <div className="text-gray-600 text-[10px] leading-relaxed">
          Sistem Deteksi Makanan<br />Karbohidrat Berbasis YOLOv8
        </div>
      </div>
    </aside>
  )
}
