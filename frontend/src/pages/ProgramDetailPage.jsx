import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import api from '../lib/api'
import ExerciseMedia from '../components/exercises/ExerciseMedia'
import ExerciseDetailModal from '../components/exercises/ExerciseDetailModal'

const fetchProgram = async (id) => {
  const res = await api.get(`/programs/${id}`)
  return res.data.data
}

const fetchActiveProgram = async () => {
  try {
    const res = await api.get('/programs/active')
    return res.data.data
  } catch (err) {
    if (err.response?.status === 404) return null
    throw err
  }
}

export default function ProgramDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [openDay, setOpenDay] = useState(0)
  const [activateError, setActivateError] = useState(null)
  const [activateSuccess, setActivateSuccess] = useState(false)
  const [selectedExerciseData, setSelectedExerciseData] = useState(null)

  const { data: program, isLoading, isError } = useQuery({
    queryKey: ['program', id],
    queryFn: () => fetchProgram(id),
    enabled: !!id,
  })

  const { data: activeProgram } = useQuery({
    queryKey: ['activeProgram'],
    queryFn: fetchActiveProgram,
  })

  const isActive = activeProgram?.program?.id === program?.id

  const activateMutation = useMutation({
    mutationFn: () => api.post(`/programs/${id}/activate`),
    onSuccess: () => {
      setActivateSuccess(true)
      setActivateError(null)
      queryClient.invalidateQueries({ queryKey: ['activeProgram'] })
      setTimeout(() => setActivateSuccess(false), 3000)
    },
    onError: () => {
      setActivateError('Failed to activate program. Please try again.')
    },
  })

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
      </div>
    )
  }

  if (isError || !program) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-zinc-400">
        <AlertCircle className="w-12 h-12 text-zinc-500" />
        <p className="text-lg font-bold">Program not found.</p>
        <button
          onClick={() => navigate('/programs')}
          className="text-orange-500 hover:underline font-semibold text-sm"
        >
          ← Back to Programs
        </button>
      </div>
    )
  }

  const sortedDays = [...(program.program_days ?? [])].sort(
    (a, b) => a.day_number - b.day_number
  )

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/programs')}
          className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors group text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Programs</span>
        </button>

        {/* Header card */}
        <div
          className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 sm:p-7 shadow-sm transition-colors ${
            isActive
              ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-orange-500/10'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                  {program.title}
                </h1>
                {isActive && (
                  <span className="flex items-center gap-1 text-xs font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active Program
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-sm font-semibold mt-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {program.days_per_week} day{program.days_per_week !== 1 ? 's' : ''} per week
                </span>
              </div>
              {program.description && (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-3 leading-relaxed">
                  {program.description}
                </p>
              )}
            </div>

            {/* Activate button */}
            {!isActive && (
              <button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isLoading}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-md shadow-orange-500/20 whitespace-nowrap"
              >
                {activateMutation.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>Activate Program</span>
              </button>
            )}
          </div>

          {/* Feedback */}
          {activateSuccess && (
            <div className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
              <CheckCircle className="w-4 h-4" />
              <span>Program activated successfully!</span>
            </div>
          )}
          {activateError && (
            <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <AlertCircle className="w-4 h-4" />
              <span>{activateError}</span>
            </div>
          )}
        </div>

        {/* Program Days Accordion */}
        {sortedDays.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Training Days ({sortedDays.length})
            </h2>
            {sortedDays.map((day, idx) => {
              const isOpen = openDay === idx
              const exercises = [...(day.program_day_exercises ?? [])].sort(
                (a, b) => a.order_index - b.order_index
              )
              return (
                <div
                  key={day.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-colors"
                >
                  {/* Accordion header */}
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                    onClick={() => setOpenDay(isOpen ? -1 : idx)}
                  >
                    <div>
                      <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">
                        Day {day.day_number}
                      </span>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                        {day.day_name || `Day ${day.day_number}`}
                      </h3>
                      {day.focus && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 capitalize">
                          {day.focus}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-xs text-zinc-400 font-medium">
                        {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                  </button>

                  {/* Accordion body */}
                  {isOpen && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/40">
                      {exercises.length === 0 ? (
                        <p className="text-zinc-400 text-xs italic py-2">
                          No exercises added for this day.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {exercises.map((pe, eIdx) => (
                            <div
                              key={pe.id}
                              onClick={() => setSelectedExerciseData({ exercise: pe.exercise, targets: pe })}
                              className="flex items-center gap-3 bg-white dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 hover:border-orange-500/50 rounded-xl px-4 py-3 shadow-xs cursor-pointer transition-colors group select-none"
                              title="Click to view full exercise demo & targets"
                            >
                              <span className="text-xs font-bold text-zinc-400 w-5 text-center shrink-0">
                                #{eIdx + 1}
                              </span>

                              {/* Thumbnail */}
                              <ExerciseMedia
                                imageUrl={pe.exercise?.image_url}
                                gifUrl={pe.exercise?.gif_url}
                                alt={pe.exercise?.name}
                                showPlayBadge={true}
                                containerClassName="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center relative pointer-events-none"
                              />

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                                  {pe.exercise?.name ?? 'Exercise'}
                                </p>
                                {pe.exercise?.body_part && (
                                  <p className="text-xs text-orange-600 dark:text-orange-400 capitalize mt-0.5">
                                    {pe.exercise.body_part}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                  <Dumbbell className="w-3.5 h-3.5" />
                                  <span>
                                    {pe.target_sets} × {pe.target_reps}
                                  </span>
                                </span>
                                {pe.rest_seconds > 0 && (
                                  <span className="flex items-center gap-1 text-zinc-400 text-[11px] font-normal">
                                    <Clock className="w-3 h-3" />
                                    <span>{pe.rest_seconds}s</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-zinc-400 py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium">No training days configured for this program.</p>
          </div>
        )}
      </div>

      {/* Exercise Demo & Details Modal */}
      {selectedExerciseData && (
        <ExerciseDetailModal
          exercise={selectedExerciseData.exercise}
          targets={selectedExerciseData.targets}
          onClose={() => setSelectedExerciseData(null)}
        />
      )}
    </>
  )
}
