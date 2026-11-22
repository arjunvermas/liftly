import { Outlet } from 'react-router-dom'
import { Flame } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import ThemeToggle from '../ui/ThemeToggle'

export default function Layout() {
  return (
<<<<<<< HEAD
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors">
=======
    <div className="app-shell flex h-screen w-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors">
>>>>>>> 97664f3cdafb1a57997f8fa9f8872b36c2c4dd31
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
<<<<<<< HEAD
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
              Wannabe<span className="text-orange-500">Lyfta</span>
=======
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-[0_0_18px_-6px_rgba(var(--accent-glow),0.85)]">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
              Lift<span className="text-orange-500">ly</span>
>>>>>>> 97664f3cdafb1a57997f8fa9f8872b36c2c4dd31
            </span>
          </div>

          <ThemeToggle />
        </header>

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
