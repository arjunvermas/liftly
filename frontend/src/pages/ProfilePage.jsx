import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User,
  Mail,
  Scale,
  Ruler,
  Target,
  Trophy,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

const FITNESS_GOALS = [
  { value: 'hypertrophy', label: 'Hypertrophy (Muscle Size)' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'general_fitness', label: 'General Fitness' },
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner (<1 year)' },
  { value: 'intermediate', label: 'Intermediate (1–3 years)' },
  { value: 'advanced', label: 'Advanced (3+ years)' },
]

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { user: storeUser, profile: storeProfile, setAuth } = useAuthStore()

  // Account User state
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
  })

  // Profile state
  const [profileForm, setProfileForm] = useState({
    bio: '',
    avatar_url: '',
    height_cm: 175,
    weight_kg: 75,
    fitness_goal: 'hypertrophy',
    experience_level: 'intermediate',
  })

  const [userSuccess, setUserSuccess] = useState('')
  const [userError, setUserError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Sync state when store updates
  useEffect(() => {
    if (storeUser) {
      setUserForm({
        name: storeUser.name || '',
        username: storeUser.username || '',
        email: storeUser.email || '',
      })
    }
    if (storeProfile) {
      setProfileForm({
        bio: storeProfile.bio || '',
        avatar_url: storeProfile.avatar_url || '',
        height_cm: storeProfile.height_cm || 175,
        weight_kg: storeProfile.weight_kg || 75,
        fitness_goal: storeProfile.fitness_goal || 'hypertrophy',
        experience_level: storeProfile.experience_level || 'intermediate',
      })
    }
  }, [storeUser, storeProfile])

  // Update User Mutation
  const userMutation = useMutation({
    mutationFn: (data) => api.patch('/auth/user', data),
    onSuccess: (res) => {
      setUserSuccess('Account details saved!')
      setUserError('')
      queryClient.invalidateQueries({ queryKey: ['me'] })
      if (res.data?.data) {
        setAuth(res.data.data, storeProfile)
      }
      setTimeout(() => setUserSuccess(''), 3000)
    },
    onError: (err) => {
      setUserError(err.response?.data?.message || 'Failed to update user account')
      setUserSuccess('')
    },
  })

  // Update Profile Mutation
  const profileMutation = useMutation({
    mutationFn: (data) => api.patch('/auth/profile', data),
    onSuccess: (res) => {
      setProfileSuccess('Fitness profile updated!')
      setProfileError('')
      queryClient.invalidateQueries({ queryKey: ['me'] })
      if (res.data?.profile) {
        setAuth(storeUser, res.data.profile)
      }
      setTimeout(() => setProfileSuccess(''), 3000)
    },
    onError: (err) => {
      setProfileError(err.response?.data?.message || 'Failed to update profile')
      setProfileSuccess('')
    },
  })

  const handleUserSubmit = (e) => {
    e.preventDefault()
    userMutation.mutate({
      name: userForm.name.trim() || null,
      username: userForm.username.trim(),
      email: userForm.email.trim(),
    })
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    profileMutation.mutate({
      bio: profileForm.bio.trim(),
      avatar_url: profileForm.avatar_url.trim() || undefined,
      height_cm: Number(profileForm.height_cm),
      weight_kg: Number(profileForm.weight_kg),
      fitness_goal: profileForm.fitness_goal,
      experience_level: profileForm.experience_level,
    })
  }

  // Calculate BMI
  const heightM = (Number(profileForm.height_cm) || 175) / 100
  const weightKg = Number(profileForm.weight_kg) || 75
  const bmi = (weightKg / (heightM * heightM)).toFixed(1)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm transition-colors">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-orange-500/30 flex items-center justify-center text-3xl font-black text-orange-500 overflow-hidden shadow-lg shrink-0">
            {profileForm.avatar_url ? (
              <img
                src={profileForm.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              (userForm.name?.[0] || userForm.username?.[0] || 'U').toUpperCase()
            )}
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                {userForm.name || userForm.username || 'Athlete'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20 capitalize">
                {profileForm.experience_level}
              </span>
            </div>
            <p className="text-sm font-semibold text-zinc-400">@{userForm.username}</p>
            {profileForm.bio && (
              <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-xl italic pt-1">
                "{profileForm.bio}"
              </p>
            )}

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-3 text-xs font-bold text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <Ruler className="w-4 h-4 text-orange-500" />
                <span>{profileForm.height_cm} cm</span>
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <Scale className="w-4 h-4 text-orange-500" />
                <span>{profileForm.weight_kg} kg</span>
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>BMI {bmi}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details Form */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-sm transition-colors">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              <span>Account Credentials</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage your display name and login email.
            </p>
          </div>

          {userSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{userSuccess}</span>
            </div>
          )}

          {userError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{userError}</span>
            </div>
          )}

          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Display Name</label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Your Name"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Username</label>
              <input
                type="text"
                required
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Email Address</label>
              <input
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={userMutation.isLoading}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold text-xs border border-zinc-200 dark:border-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              {userMutation.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              ) : (
                <Save className="w-4 h-4 text-orange-500" />
              )}
              <span>Update Account</span>
            </button>
          </form>
        </div>

        {/* Fitness Profile Form */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-sm transition-colors">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              <span>Fitness Profile</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Customize your body stats and training goals.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Height (cm)</label>
                <input
                  type="number"
                  min="50"
                  max="280"
                  value={profileForm.height_cm}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, height_cm: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Weight (kg)</label>
                <input
                  type="number"
                  min="20"
                  max="400"
                  value={profileForm.weight_kg}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, weight_kg: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Fitness Goal</label>
              <select
                value={profileForm.fitness_goal}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, fitness_goal: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
              >
                {FITNESS_GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Experience</label>
              <select
                value={profileForm.experience_level}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, experience_level: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
              >
                {EXPERIENCE_LEVELS.map((exp) => (
                  <option key={exp.value} value={exp.value}>
                    {exp.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Bio</label>
              <textarea
                rows={2}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="A bit about your fitness journey..."
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={profileMutation.isLoading}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              {profileMutation.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Fitness Profile</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
