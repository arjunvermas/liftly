import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Flame } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import GoogleAuthButton from '../components/auth/GoogleAuthButton'
import ThemeToggle from '../components/ui/ThemeToggle'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.identifier.trim()) e.identifier = 'Email or username is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setErrors((p) => ({ ...p, [e.target.name]: '' }))
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) {
      setErrors(v)
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        identifier: form.identifier.trim(),
        password: form.password,
      })
      const user = data.data || data.user
      setAuth(user, data.profile ?? null)
      navigate('/')
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Invalid credentials. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center px-4 py-8 relative transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 mb-3 shadow-md shadow-orange-500/10">
            <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Wannabe<span className="text-orange-500">Lyfta</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-semibold uppercase tracking-wider">
            Your fitness gains start here
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-7 shadow-xl space-y-5 transition-colors">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Sign in to your account
          </h2>

          {/* Google */}
          <GoogleAuthButton />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Identifier */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Email or Username
              </label>
              <input
                type="text"
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                autoComplete="username"
                placeholder="you@example.com"
                className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors ${
                  errors.identifier ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              />
              {errors.identifier && (
                <p className="mt-1 text-xs text-red-500 font-semibold">{errors.identifier}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors ${
                    errors.password ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-semibold">{errors.password}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5 text-xs text-red-500 font-semibold">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-orange-500/20"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-semibold text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-orange-500 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
