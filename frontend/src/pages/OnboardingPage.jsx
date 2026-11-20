import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Flame } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import ThemeToggle from '../components/ui/ThemeToggle'

const FITNESS_GOALS = [
  { value: 'hypertrophy', label: 'Hypertrophy – Build muscle size' },
  { value: 'strength', label: 'Strength – Get stronger' },
  { value: 'endurance', label: 'Endurance – Improve stamina' },
  { value: 'weight_loss', label: 'Weight Loss – Burn fat' },
  { value: 'general_fitness', label: 'General Fitness – Stay healthy' },
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: '< 1 year of training' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years of training' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years of training' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { setAuth, user } = useAuthStore()

  const [form, setForm] = useState({
    height_cm: '',
    weight_kg: '',
    fitness_goal: 'hypertrophy',
    experience_level: 'intermediate',
    bio: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setErrors((p) => ({ ...p, [name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const e = {}
    if (!form.height_cm || isNaN(form.height_cm) || form.height_cm <= 0)
      e.height_cm = 'Enter a valid height'
    if (!form.weight_kg || isNaN(form.weight_kg) || form.weight_kg <= 0)
      e.weight_kg = 'Enter a valid weight'
    if (!form.fitness_goal) e.fitness_goal = 'Choose a fitness goal'
    if (!form.experience_level) e.experience_level = 'Choose your experience level'
    return e
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
      const payload = {
        height_cm: parseFloat(form.height_cm),
        weight_kg: parseFloat(form.weight_kg),
        fitness_goal: form.fitness_goal,
        experience_level: form.experience_level,
        bio: form.bio.trim() || undefined,
      }
      const { data } = await api.patch('/auth/profile', payload)
      setAuth(user, data.profile ?? data)
      navigate('/')
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Could not save your profile. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center px-4 py-12 relative transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 mb-3 shadow-md shadow-orange-500/10">
            <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Almost there!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-semibold uppercase tracking-wider">
            Set up your fitness profile to calibrate workouts
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-7 shadow-xl transition-colors">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Height + Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  name="height_cm"
                  value={form.height_cm}
                  onChange={handleChange}
                  placeholder="178"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                />
                {errors.height_cm && (
                  <p className="text-[11px] text-red-500 font-semibold">{errors.height_cm}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="weight_kg"
                  value={form.weight_kg}
                  onChange={handleChange}
                  placeholder="75"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                />
                {errors.weight_kg && (
                  <p className="text-[11px] text-red-500 font-semibold">{errors.weight_kg}</p>
                )}
              </div>
            </div>

            {/* Fitness Goal */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Fitness Goal *
              </label>
              <select
                name="fitness_goal"
                value={form.fitness_goal}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500 cursor-pointer font-medium"
              >
                {FITNESS_GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Experience Level *
              </label>
              <select
                name="experience_level"
                value={form.experience_level}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500 cursor-pointer font-medium"
              >
                {EXPERIENCE_LEVELS.map((exp) => (
                  <option key={exp.value} value={exp.value}>
                    {exp.label} – {exp.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Bio <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={2}
                placeholder="A bit about your fitness targets…"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {serverError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-500 font-semibold">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-orange-500/20 mt-2"
            >
              {loading ? 'Saving Profile…' : 'Complete Setup & Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
