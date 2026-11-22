import { create } from 'zustand'

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.classList.add('light')
    root.setAttribute('data-theme', 'light')
  }
}

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('wannabe_theme')
    if (saved === 'light' || saved === 'dark') return saved
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  }
  return 'dark'
}

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('wannabe_theme', nextTheme)
      } catch (e) {}
      applyTheme(nextTheme)
      return { theme: nextTheme }
    }),
  setTheme: (theme) => {
    try {
      localStorage.setItem('wannabe_theme', theme)
    } catch (e) {}
    applyTheme(theme)
    set({ theme })
  },
}))

if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme())
}
