import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Weight,
  Calendar,
} from 'lucide-react'
import api from '../lib/api'

function formatDateGroupKey(dateStr) {
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

function formatDateGroupLabel(dateKey) {
  const d = new Date(dateKey + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

function calcVolume(session) {
  if (!session.workout_sets) return 0
  return session.workout_sets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight_kg || 0), 0)
}

function SessionCard({ session, onDelete }) {
  const navigate = useNavigate()
  const volume = calcVolume(session)
  const setsCount = session.workout_sets?.length ?? 0

  return (
    <div
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-orange-500/50 hover:shadow-md transition-all cursor-pointer group shadow-sm"
      onClick={() => navigate(`/history/${session.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-zinc-900 dark:text-white text-base truncate group-hover:text-orange-500 transition-colors">
            {session.title || 'Untitled Workout'}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {new Date(session.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(session)
          }}
          className="text-zinc-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
          title="Delete session"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        {session.duration_minutes != null && (
          <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
            <Clock size={13} className="text-orange-500" />
            <span>{session.duration_minutes} min</span>
          </span>
        )}
        <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
          <Dumbbell size={13} className="text-orange-500" />
          <span>{setsCount} sets</span>
        </span>
        {volume > 0 && (
          <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
            <Weight size={13} className="text-orange-500" />
            <span>{volume.toLocaleString()} kg volume</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const LIMIT = 20

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sessions', page],
    queryFn: () => api.get('/sessions', { params: { page, limit: LIMIT } }).then((r) => r.data),
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['recentSessions'] })
      setDeleteTarget(null)
    },
  })

  const sessions = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  // Group sessions by date
  const grouped = sessions.reduce((acc, session) => {
    const key = formatDateGroupKey(session.completed_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(session)
    return acc
  }, {})
  const sortedKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <span>Workout History</span>
            {total > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                {total} sessions
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Review your past workout logs, volume numbers, and performance.
          </p>
        </div>

        <button
          onClick={() => navigate('/log')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/20 shrink-0"
        >
          <Plus size={16} />
          <span>Log Workout</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 py-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 animate-pulse shadow-sm">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-3" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-850 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-16 text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm">
          Failed to load workout history.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && sessions.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-3 shadow-sm">
          <Dumbbell size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto" />
          <p className="text-zinc-900 dark:text-white font-bold text-lg">No workouts logged yet</p>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Hit "Log Workout" above to record your sets and start tracking your volume progression!
          </p>
        </div>
      )}

      {/* Grouped sessions */}
      {!isLoading && sortedKeys.map((key) => (
        <div key={key} className="space-y-3">
          <div className="flex items-center gap-2 pt-2">
            <Calendar size={14} className="text-orange-500" />
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {formatDateGroupLabel(key)}
            </h2>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="space-y-3">
            {grouped[key].map((session) => (
              <SessionCard key={session.id} session={session} onDelete={setDeleteTarget} />
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-xs text-zinc-500 font-semibold">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <Trash2 size={28} className="text-red-500 mx-auto" />
            <div className="text-center">
              <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Delete Workout?</h3>
              <p className="text-zinc-500 text-xs mt-1">
                "{deleteTarget.title || 'Untitled Workout'}" will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold transition-colors text-zinc-700 dark:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
