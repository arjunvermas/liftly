import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Trash2,
  Check,
  Search,
  Timer,
  Dumbbell,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react'
import api from '../lib/api'
import ExerciseMedia from '../components/exercises/ExerciseMedia'

export default function LogWorkoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dayId = searchParams.get('dayId')
  const queryClient = useQueryClient()

  // Elapsed timer state
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isActive])

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Workout details
  const [title, setTitle] = useState('Workout Session')
  const [notes, setNotes] = useState('')
  const [workoutExercises, setWorkoutExercises] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch active program to auto-populate if dayId provided
  const { data: activeData } = useQuery({
    queryKey: ['activeProgram'],
    queryFn: async () => {
      try {
        const res = await api.get('/programs/active')
        return res.data.data
      } catch (err) {
        return null
      }
    },
  })

  // Populate from active program if day matches
  useEffect(() => {
    if (!activeData || workoutExercises.length > 0) return

    let targetDay = null
    if (dayId && activeData.program?.program_days) {
      targetDay = activeData.program.program_days.find((d) => d.id === dayId)
    } else if (activeData.today) {
      targetDay = activeData.today
    }

    if (targetDay) {
      setTitle(targetDay.day_name || 'Workout Session')
      if (targetDay.program_day_exercises?.length) {
        const mapped = targetDay.program_day_exercises.map((pde) => {
          const setsCount = pde.target_sets || 3
          const defaultSets = []
          for (let s = 1; s <= setsCount; s++) {
            defaultSets.push({
              set_number: s,
              weight_kg: 0,
              reps: parseInt(pde.target_reps, 10) || 10,
              rpe: '',
              completed: false,
            })
          }
          return {
            exercise_id: pde.exercise?.id || pde.exercise_id,
            name: pde.exercise?.name || 'Exercise',
            body_part: pde.exercise?.body_part || '',
            image_url: pde.exercise?.image_url,
            gif_url: pde.exercise?.gif_url,
            sets: defaultSets,
          }
        })
        setWorkoutExercises(mapped)
      }
    }
  }, [activeData, dayId])

  // Exercise Search Modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [exerciseQuery, setExerciseQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (!searchModalOpen) return
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await api.get('/workouts', {
          params: { name: exerciseQuery, limit: 30 },
        })
        setSearchResults(res.data.data || [])
      } catch (e) {
        console.error('Failed to search exercises:', e)
      } finally {
        setSearchLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [exerciseQuery, searchModalOpen])

  const addExerciseToWorkout = (exercise) => {
    setWorkoutExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        body_part: exercise.body_part,
        image_url: exercise.image_url,
        gif_url: exercise.gif_url,
        sets: [
          { set_number: 1, weight_kg: 0, reps: 10, rpe: '', completed: false },
          { set_number: 2, weight_kg: 0, reps: 10, rpe: '', completed: false },
          { set_number: 3, weight_kg: 0, reps: 10, rpe: '', completed: false },
        ],
      },
    ])
    setSearchModalOpen(false)
  }

  const removeExerciseFromWorkout = (index) => {
    setWorkoutExercises((prev) => prev.filter((_, idx) => idx !== index))
  }

  const addSetToExercise = (exIndex) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIndex) return ex
        const newSetNum = ex.sets.length + 1
        const lastSet = ex.sets[ex.sets.length - 1]
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              set_number: newSetNum,
              weight_kg: lastSet ? lastSet.weight_kg : 0,
              reps: lastSet ? lastSet.reps : 10,
              rpe: '',
              completed: false,
            },
          ],
        }
      })
    )
  }

  const removeSetFromExercise = (exIndex, setIndex) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIndex) return ex
        const filtered = ex.sets.filter((_, sIdx) => sIdx !== setIndex)
        return {
          ...ex,
          sets: filtered.map((s, sIdx) => ({ ...s, set_number: sIdx + 1 })),
        }
      })
    )
  }

  const updateSetField = (exIndex, setIndex, field, value) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIndex) return ex
        const updatedSets = [...ex.sets]
        updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value }
        return { ...ex, sets: updatedSets }
      })
    )
  }

  const toggleSetComplete = (exIndex, setIndex) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIndex) return ex
        const updatedSets = [...ex.sets]
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          completed: !updatedSets[setIndex].completed,
        }
        return { ...ex, sets: updatedSets }
      })
    )
  }

  const handleFinishWorkout = async () => {
    setError('')

    const allSets = []
    for (const ex of workoutExercises) {
      for (const s of ex.sets) {
        allSets.push({
          exercise_id: ex.exercise_id,
          set_number: s.set_number,
          reps: Number(s.reps) || 0,
          weight_kg: Number(s.weight_kg) || 0,
          rpe: s.rpe ? Number(s.rpe) : null,
        })
      }
    }

    if (allSets.length === 0) {
      setError('Please add at least one exercise and set before finishing.')
      return
    }

    const durationMins = Math.max(1, Math.round(seconds / 60))

    const payload = {
      program_day_id: dayId || null,
      title: title.trim() || 'Workout Session',
      duration_minutes: durationMins,
      notes: notes.trim() || null,
      sets: allSets,
    }

    setSubmitting(true)
    try {
      await api.post('/sessions', payload)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['recentSessions'] })
      navigate('/history')
    } catch (err) {
      console.error('Log workout error:', err)
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? JSON.stringify(err.response.data.errors)
          : 'Failed to save workout session')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Workout</span>
        </button>

        {/* Live Timer Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-orange-600 dark:text-orange-400 shadow-sm">
          <Timer className="w-4 h-4 text-orange-500 animate-pulse" />
          <span>{formatTime(seconds)}</span>
          <button
            onClick={() => setIsActive(!isActive)}
            className="ml-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Workout Info Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 space-y-3 shadow-sm transition-colors">
        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
            Workout Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl sm:text-2xl font-black text-zinc-900 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-orange-500 outline-none transition-colors py-1"
          />
        </div>
        <textarea
          rows={1}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Session notes, how it felt, pump score..."
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Exercises Log Section */}
      <div className="space-y-4">
        {workoutExercises.map((ex, exIdx) => (
          <div
            key={ex.exercise_id + exIdx}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm transition-colors"
          >
            {/* Exercise Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center border border-orange-500/30">
                  {exIdx + 1}
                </span>

                <ExerciseMedia
                  imageUrl={ex.image_url}
                  gifUrl={ex.gif_url}
                  alt={ex.name}
                  containerClassName="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center relative"
                />

                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-tight">
                    {ex.name}
                  </h3>
                  <span className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold capitalize">
                    {ex.body_part}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeExerciseFromWorkout(exIdx)}
                className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Sets Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-zinc-400 px-2 tracking-wider">
                <span className="col-span-2 text-center">Set</span>
                <span className="col-span-3 text-center">Weight (kg)</span>
                <span className="col-span-3 text-center">Reps</span>
                <span className="col-span-2 text-center">RPE</span>
                <span className="col-span-2 text-center">Check</span>
              </div>

              {ex.sets.map((set, setIdx) => (
                <div
                  key={setIdx}
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-colors ${
                    set.completed
                      ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <span className="col-span-2 text-center font-bold text-xs text-zinc-900 dark:text-white">
                    {set.set_number}
                  </span>

                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={set.weight_kg}
                      onChange={(e) =>
                        updateSetField(exIdx, setIdx, 'weight_kg', e.target.value)
                      }
                      className="w-full text-center py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      value={set.reps}
                      onChange={(e) =>
                        updateSetField(exIdx, setIdx, 'reps', e.target.value)
                      }
                      className="w-full text-center py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="8"
                      value={set.rpe}
                      onChange={(e) =>
                        updateSetField(exIdx, setIdx, 'rpe', e.target.value)
                      }
                      className="w-full text-center py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSetComplete(exIdx, setIdx)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        set.completed
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                          : 'bg-zinc-200 dark:bg-zinc-700/60 text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                    {ex.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSetFromExercise(exIdx, setIdx)}
                        className="text-zinc-400 hover:text-red-500 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addSetToExercise(exIdx)}
              className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-orange-500" />
              <span>Add Set</span>
            </button>
          </div>
        ))}

        {/* Add Exercise CTA Button */}
        <button
          type="button"
          onClick={() => {
            setExerciseQuery('')
            setSearchModalOpen(true)
          }}
          className="w-full py-4 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-zinc-900/40 text-zinc-500 hover:text-orange-500 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exercise to Workout</span>
        </button>
      </div>

      {/* Finish Workout Primary Button */}
      <div className="pt-4 pb-8">
        <button
          type="button"
          onClick={handleFinishWorkout}
          disabled={submitting || workoutExercises.length === 0}
          className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base transition-all shadow-xl shadow-orange-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Workout Session...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Complete & Finish Workout</span>
            </>
          )}
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-zinc-900 dark:text-white text-base">Select Exercise</h3>
              <button
                onClick={() => setSearchModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  autoFocus
                  value={exerciseQuery}
                  onChange={(e) => setExerciseQuery(e.target.value)}
                  placeholder="Search exercise..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {searchLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  No exercises found
                </div>
              ) : (
                searchResults.map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => addExerciseToWorkout(exercise)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-2xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ExerciseMedia
                        imageUrl={exercise.image_url}
                        gifUrl={exercise.gif_url}
                        alt={exercise.name}
                        containerClassName="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center relative"
                      />
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{exercise.name}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 capitalize">
                          {exercise.body_part} • {exercise.equipment}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                      Add +
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
