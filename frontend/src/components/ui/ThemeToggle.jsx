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
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700/80 transition-all ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in fade-in zoom-in duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-700 animate-in fade-in zoom-in duration-200" />
      )}
    </button>
  )
}
