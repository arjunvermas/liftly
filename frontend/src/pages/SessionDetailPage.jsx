import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dumbbell,
  Trash2,
  TrendingUp,
  Weight,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import api from '../lib/api'
import ExerciseMedia from '../components/exercises/ExerciseMedia'

export default function SessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: sessionData, isLoading, isError, error } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const res = await api.get(`/sessions/${id}`)
      return res.data.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['recentSessions'] })
      navigate('/history')
    },
  })

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm">Loading session breakdown...</p>
      </div>
    )
  }

  if (isError || !sessionData) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error?.message || 'Failed to load session details.'}
        </div>
        <button
          onClick={() => navigate('/history')}
          className="text-xs text-orange-500 hover:underline font-bold"
        >
          ← Return to History
        </button>
      </div>
    )
  }

  const session = sessionData
  const summary = session.summary || {
    total_sets: 0,
    total_reps: 0,
    total_volume_kg: 0,
    exercises: [],
  }

  const formattedDate = new Date(session.completed_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedTime = new Date(session.completed_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to History</span>
        </button>

        <button
          onClick={() => {
            if (!confirmDelete) {
              setConfirmDelete(true)
              return
            }
            deleteMutation.mutate()
          }}
          disabled={deleteMutation.isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border shadow-xs ${
            confirmDelete
              ? 'bg-red-500 text-white border-red-600'
              : 'text-zinc-600 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-500/10'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{confirmDelete ? 'Click again to confirm' : 'Delete Workout'}</span>
        </button>
      </div>

      {/* Session Title & Metadata Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm transition-colors">
        <div>
          <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2.5 py-0.5 rounded-md border border-orange-500/20">
            Workout Summary
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-2">
            {session.title || 'Workout Session'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 pt-1">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>
              {formattedDate} at {formattedTime}
            </span>
          </span>
          {session.duration_minutes != null && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>{session.duration_minutes} minutes</span>
            </span>
          )}
        </div>

        {session.notes && (
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 italic border border-zinc-200 dark:border-zinc-700/60">
            "{session.notes}"
          </div>
        )}
      </div>

      {/* Summary KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1 font-semibold uppercase tracking-wider">
            <Weight className="w-4 h-4 text-orange-500" />
            <span>Total Volume</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            {summary.total_volume_kg.toLocaleString()}{' '}
            <span className="text-xs font-bold text-zinc-400">kg</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1 font-semibold uppercase tracking-wider">
            <Layers className="w-4 h-4 text-orange-500" />
            <span>Total Sets</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            {summary.total_sets}{' '}
            <span className="text-xs font-bold text-zinc-400">sets</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm col-span-2 sm:col-span-1 transition-colors">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1 font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span>Total Reps</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            {summary.total_reps.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Exercise by Exercise Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <span>Exercises Hit</span>
          <span className="text-xs font-bold text-zinc-400">({summary.exercises.length})</span>
        </h2>

        <div className="space-y-4">
          {summary.exercises.map((item, idx) => (
            <div
              key={item.exercise?.id || idx}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-colors"
            >
              {/* Exercise Header */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black text-xs">
                    {idx + 1}
                  </span>

                  <ExerciseMedia
                    imageUrl={item.exercise?.image_url}
                    gifUrl={item.exercise?.gif_url}
                    alt={item.exercise?.name}
                    containerClassName="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center relative"
                  />

                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                      {item.exercise?.name || 'Exercise'}
                    </h3>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold capitalize">
                      {item.exercise?.body_part || 'General'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  <span>
                    Top Weight:{' '}
                    <strong className="text-zinc-900 dark:text-white font-bold">
                      {item.top_weight_kg} kg
                    </strong>
                  </span>
                  <span>
                    Volume:{' '}
                    <strong className="text-zinc-900 dark:text-white font-bold">
                      {item.volume_kg.toLocaleString()} kg
                    </strong>
                  </span>
                </div>
              </div>

              {/* Sets Table */}
              <div className="p-4 sm:p-5 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="pb-2.5 pl-2">Set</th>
                      <th className="pb-2.5">Weight</th>
                      <th className="pb-2.5">Reps</th>
                      <th className="pb-2.5">Set Volume</th>
                      <th className="pb-2.5">RPE</th>
                      <th className="pb-2.5 pr-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold">
                    {item.sets.map((set) => {
                      const setVol = Number(set.weight_kg) * Number(set.reps)
                      return (
                        <tr key={set.id || set.set_number} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                          <td className="py-2.5 pl-2 font-black text-zinc-900 dark:text-white">
                            {set.set_number}
                          </td>
                          <td className="py-2.5 text-zinc-700 dark:text-zinc-200">
                            {set.weight_kg} kg
                          </td>
                          <td className="py-2.5 text-zinc-700 dark:text-zinc-200">
                            {set.reps}
                          </td>
                          <td className="py-2.5 text-zinc-400">{setVol} kg</td>
                          <td className="py-2.5 text-orange-600 dark:text-orange-400">
                            {set.rpe ? `@ ${set.rpe}` : '—'}
                          </td>
                          <td className="py-2.5 pr-2 text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Hit</span>
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
