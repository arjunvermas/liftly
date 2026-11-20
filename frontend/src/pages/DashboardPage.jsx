import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  CalendarCheck,
  Dumbbell,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react'

import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import StatsCard from '../components/dashboard/StatsCard'
import ActiveProgramBanner from '../components/dashboard/ActiveProgramBanner'
import TodayWorkout from '../components/dashboard/TodayWorkout'
import ThemeToggle from '../components/ui/ThemeToggle'

// ─── helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(mins) {
  if (!mins && mins !== 0) return '—'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

// ─── data fetchers ───────────────────────────────────────────────────────────

const fetchActiveProgram = async () => {
  const { data } = await api.get('/programs/active')
  return data?.data ?? null
}

const fetchSessions = async () => {
  const { data } = await api.get('/sessions?limit=5')
  return data ?? null
}

// ─── component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const {
    data: activeProgram,
    isLoading: programLoading,
  } = useQuery({
    queryKey: ['activeProgram'],
    queryFn: fetchActiveProgram,
    retry: false,
    onError: () => null,
  })

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
  } = useQuery({
    queryKey: ['recentSessions'],
    queryFn: fetchSessions,
    retry: 1,
  })

  const totalSessions = sessionsData?.total ?? 0
  const recentSessions = (sessionsData?.data ?? []).slice(0, 3)
  const lastSession = recentSessions[0]

  const isLoading = programLoading || sessionsLoading

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Welcome Bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
            {todayLabel}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {getGreeting()},{' '}
            <span className="text-orange-500">{user?.name ?? user?.username ?? 'Athlete'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* No Active Program Banner */}
          {!activeProgram && (
            <button
              onClick={() => navigate('/programs')}
              className="w-full group bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-3 transition-all shadow-sm text-center"
            >
              <div className="p-4 bg-orange-500/10 rounded-2xl group-hover:bg-orange-500/20 text-orange-500 transition-colors">
                <Dumbbell className="w-10 h-10" />
              </div>
              <div>
                <p className="text-zinc-900 dark:text-white font-extrabold text-xl">
                  Pick a Program to Get Started
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 max-w-md">
                  Activate a training split to track your daily workouts, sets, and progress automatically.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-bold mt-2 group-hover:gap-3 transition-all">
                <span>Browse All Programs</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          )}

          {/* Active Program & Today's Workout */}
          {activeProgram && (
            <div className="space-y-5">
              <ActiveProgramBanner
                program={activeProgram.program}
                startedAt={activeProgram.started_at}
              />
              <TodayWorkout
                today={activeProgram.today}
                currentDayNumber={activeProgram.current_day_number}
              />
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              icon={Activity}
              label="Total Workouts Logged"
              value={totalSessions}
              sub="all time recorded sessions"
            />
            <StatsCard
              icon={CalendarCheck}
              label="Last Workout"
              value={lastSession ? formatDate(lastSession.completed_at) : '—'}
              sub={lastSession ? lastSession.title ?? 'Workout' : 'No workouts logged yet'}
            />
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-900 dark:text-white text-base font-extrabold tracking-tight">
                Recent Workouts
              </h2>
              {recentSessions.length > 0 && (
                <button
                  onClick={() => navigate('/history')}
                  className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  View all history
                </button>
              )}
            </div>

            {recentSessions.length > 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden shadow-sm">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/history/${session.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-zinc-900 dark:text-white text-sm font-bold truncate group-hover:text-orange-500 transition-colors">
                        {session.title ?? 'Workout Session'}
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                        {formatDate(session.completed_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-bold bg-orange-500/10 px-2.5 py-1 rounded-lg">
                        {formatDuration(session.duration_minutes)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-8 text-center text-zinc-500 text-sm shadow-sm">
                No workouts logged yet. Complete your first workout to see your history here!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
