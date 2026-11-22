import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  Dumbbell,
  History,
  User,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: LayoutDashboard },
  { to: '/programs', label: 'Programs', icon: Layers },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-50 px-2 py-1 shadow-lg transition-colors">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-3 rounded-lg transition-all text-[11px] font-semibold ${
                isActive
                  ? 'text-orange-500 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
