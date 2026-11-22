import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  Dumbbell,
  History,
  User,
  LogOut,
  Flame,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import api, { clearAuthToken } from '../../lib/api'
import ThemeToggle from '../ui/ThemeToggle'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/programs', label: 'Programs', icon: Layers },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, profile, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      clearAuthToken()
      queryClient.clear()
      logout()
      navigate('/login')
    }
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shrink-0 select-none transition-colors">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-sm shadow-orange-500/10">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white block">
              Wannabe<span className="text-orange-500">Lyfta</span>
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold block">
              Workout Tracker
            </span>
          </div>
        </div>

        <ThemeToggle />
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-l-4 border-orange-500 font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm overflow-hidden">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              (user?.name?.[0] || user?.username?.[0] || 'U').toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200 truncate">
              {user?.name || user?.username || 'Athlete'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate capitalize">
              {profile?.fitness_goal ? profile.fitness_goal.replace('_', ' ') : 'Ready to train'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
