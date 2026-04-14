import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import Sidebar from './Sidebar'

const navItems = [
  { label: 'Beranda', path: '/', icon: 'dashboard' },
  { label: 'Deteksi', path: '/detect', icon: 'photo_camera' },
  { label: 'Model', path: '/model', icon: 'model_training' },
  { label: 'API', path: '/api-docs', icon: 'api' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-[#F9FAFB]">
      <Sidebar />
      <main className="flex-1 overflow-hidden pb-14 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-[#111827] flex md:hidden border-t border-white/10 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
                isActive ? 'text-[#059669]' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} size={20} className={isActive ? 'text-[#059669]' : 'text-gray-400'} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
