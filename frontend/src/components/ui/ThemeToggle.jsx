import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
<<<<<<< HEAD
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700/80 transition-all ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in fade-in zoom-in duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-700 animate-in fade-in zoom-in duration-200" />
=======
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-zinc-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 bg-zinc-100 hover:bg-orange-500/10 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200 hover:border-orange-500/40 dark:border-zinc-700/80 dark:hover:border-orange-500/40 transition-all duration-200 active:scale-95 hover:shadow-[0_0_20px_-8px_rgba(var(--accent-glow),0.9)] ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-orange-500 animate-in" />
      ) : (
        <Moon className="w-4 h-4 text-orange-500 animate-in" />
>>>>>>> 97664f3cdafb1a57997f8fa9f8872b36c2c4dd31
      )}
    </button>
  )
}
