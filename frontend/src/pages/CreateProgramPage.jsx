import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Dumbbell,
  Clock,
  Sparkles,
  Save,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import api from '../lib/api'
import ExerciseMedia from '../components/exercises/ExerciseMedia'

export default function CreateProgramPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Program general details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState(3)

  // Days array
  const [days, setDays] = useState([
    {
      day_number: 1,
      day_name: 'Day 1 - Push',
      focus: 'Chest, Shoulders & Triceps',
      exercises: [],
    },
    {
      day_number: 2,
      day_name: 'Day 2 - Pull',
      focus: 'Back & Biceps',
      exercises: [],
    },
    {
      day_number: 3,
      day_name: 'Day 3 - Legs',
      focus: 'Quads, Hamstrings & Calves',
      exercises: [],
    },
  ])

  // Active day accordion
  const [expandedDay, setExpandedDay] = useState(1)

  // Exercise search modal state
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false)
  const [targetDayNumber, setTargetDayNumber] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [exerciseList, setExerciseList] = useState([])
  const [loadingExercises, setLoadingExercises] = useState(false)

  // Update days array when daysPerWeek changes
  const handleDaysPerWeekChange = (newCount) => {
    const num = Math.min(7, Math.max(1, parseInt(newCount, 10) || 1))
    setDaysPerWeek(num)
    setDays((prev) => {
      const next = [...prev]
      if (num > prev.length) {
        for (let i = prev.length + 1; i <= num; i++) {
          next.push({
            day_number: i,
            day_name: `Day ${i}`,
            focus: 'Full Body',
            exercises: [],
          })
        }
      } else if (num < prev.length) {
        return next.slice(0, num)
      }
      return next
    })
  }

  // Fetch exercises for search
  useEffect(() => {
    if (!exerciseModalOpen) return
    const timer = setTimeout(async () => {
      setLoadingExercises(true)
      try {
        const res = await api.get('/workouts', {
          params: { name: searchQuery, limit: 30 },
        })
        setExerciseList(res.data.data || [])
      } catch (err) {
        console.error('Fetch exercises error:', err)
      } finally {
        setLoadingExercises(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery, exerciseModalOpen])

  const openAddExerciseModal = (dayNum) => {
    setTargetDayNumber(dayNum)
    setSearchQuery('')
    setExerciseModalOpen(true)
  }

  const addExerciseToDay = (exercise) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day_number !== targetDayNumber) return d
        const newOrderIndex = d.exercises.length + 1
        return {
          ...d,
          exercises: [
            ...d.exercises,
            {
              exercise_id: exercise.id,
              name: exercise.name,
              body_part: exercise.body_part,
              image_url: exercise.image_url,
              gif_url: exercise.gif_url,
              order_index: newOrderIndex,
              target_sets: 3,
              target_reps: '8-12',
              rest_seconds: 90,
              notes: '',
            },
          ],
        }
      })
    )
    setExerciseModalOpen(false)
  }

  const removeExercise = (dayNum, exIndex) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day_number !== dayNum) return d
        const filtered = d.exercises.filter((_, idx) => idx !== exIndex)
        return {
          ...d,
          exercises: filtered.map((ex, idx) => ({ ...ex, order_index: idx + 1 })),
        }
      })
    )
  }

  const updateExerciseField = (dayNum, exIndex, field, value) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day_number !== dayNum) return d
        const updated = [...d.exercises]
        updated[exIndex] = { ...updated[exIndex], [field]: value }
        return { ...d, exercises: updated }
      })
    )
  }

  const moveExercise = (dayNum, index, direction) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day_number !== dayNum) return d
        const targetIdx = direction === 'up' ? index - 1 : index + 1
        if (targetIdx < 0 || targetIdx >= d.exercises.length) return d
        const updated = [...d.exercises]
        const temp = updated[index]
        updated[index] = updated[targetIdx]
        updated[targetIdx] = temp
        return {
          ...d,
          exercises: updated.map((ex, idx) => ({ ...ex, order_index: idx + 1 })),
        }
      })
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Program title is required')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      days_per_week: Number(daysPerWeek),
      days: days.map((d) => ({
        day_number: d.day_number,
        day_name: d.day_name.trim() || `Day ${d.day_number}`,
        focus: d.focus.trim() || 'General',
        exercises: d.exercises.map((ex, idx) => ({
          exercise_id: ex.exercise_id,
          order_index: idx + 1,
          target_sets: Number(ex.target_sets) || 3,
          target_reps: String(ex.target_reps || '10'),
          rest_seconds: Number(ex.rest_seconds) || 90,
          notes: ex.notes?.trim() || null,
        })),
      })),
    }

    setSubmitting(true)
    try {
      await api.post('/programs', payload)
      navigate('/programs')
    } catch (err) {
      console.error('Create program error:', err)
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? JSON.stringify(err.response.data.errors)
          : 'Failed to create program')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/programs')}
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Programs</span>
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Program</span>
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
          <span>Create Custom Split</span>
          <Sparkles className="w-6 h-6 text-orange-500" />
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Design your custom weekly split, workout days, and exercises.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* General Settings Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm transition-colors">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
          1. Program Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              Program Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 4-Day Upper / Lower Hypertrophy"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              Days Per Week (1–7)
            </label>
            <select
              value={daysPerWeek}
              onChange={(e) => handleDaysPerWeekChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 transition-colors cursor-pointer font-medium"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Day' : 'Days'} / week
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals, target frequency, progression tips..."
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Days Builder */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
          2. Program Days & Exercises
        </h2>

        <div className="space-y-3">
          {days.map((day) => {
            const isExpanded = expandedDay === day.day_number
            return (
              <div
                key={day.day_number}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden transition-all shadow-sm"
              >
                {/* Day Header Accordion Toggle */}
                <div
                  onClick={() => setExpandedDay(isExpanded ? null : day.day_number)}
                  className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 select-none transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-extrabold text-sm">
                      {day.day_number}
                    </span>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                        {day.day_name || `Day ${day.day_number}`}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {day.focus || 'No focus'} • {day.exercises.length} exercises
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Day Details & Exercises */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800/80 space-y-5 bg-zinc-50/60 dark:bg-zinc-950/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-500 font-semibold">Day Name</label>
                        <input
                          type="text"
                          value={day.day_name}
                          onChange={(e) => {
                            const val = e.target.value
                            setDays((prev) =>
                              prev.map((d) =>
                                d.day_number === day.day_number
                                  ? { ...d, day_name: val }
                                  : d
                              )
                            )
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-500 font-semibold">Focus</label>
                        <input
                          type="text"
                          value={day.focus}
                          onChange={(e) => {
                            const val = e.target.value
                            setDays((prev) =>
                              prev.map((d) =>
                                d.day_number === day.day_number ? { ...d, focus: val } : d
                              )
                            )
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Exercises List in Day */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          Exercises ({day.exercises.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => openAddExerciseModal(day.day_number)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-500/30 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Exercise</span>
                        </button>
                      </div>

                      {day.exercises.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-zinc-400 text-xs">
                          No exercises added to this day yet. Click "+ Add Exercise" above.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {day.exercises.map((ex, exIdx) => (
                            <div
                              key={ex.exercise_id + exIdx}
                              className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center gap-3 justify-between shadow-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="text-xs font-bold text-zinc-400 w-4">
                                  #{exIdx + 1}
                                </span>

                                <ExerciseMedia
                                  imageUrl={ex.image_url}
                                  gifUrl={ex.gif_url}
                                  alt={ex.name}
                                  containerClassName="w-11 h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center relative"
                                />

                                <div>
                                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                    {ex.name}
                                  </p>
                                  <p className="text-xs text-orange-600 dark:text-orange-400 capitalize">
                                    {ex.body_part}
                                  </p>
                                </div>
                              </div>

                              {/* Target Parameters */}
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-zinc-400 font-semibold block">Sets</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={ex.target_sets}
                                    onChange={(e) =>
                                      updateExerciseField(
                                        day.day_number,
                                        exIdx,
                                        'target_sets',
                                        e.target.value
                                      )
                                    }
                                    className="w-16 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-center focus:border-orange-500 outline-none font-bold"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-zinc-400 font-semibold block">Reps</span>
                                  <input
                                    type="text"
                                    value={ex.target_reps}
                                    onChange={(e) =>
                                      updateExerciseField(
                                        day.day_number,
                                        exIdx,
                                        'target_reps',
                                        e.target.value
                                      )
                                    }
                                    placeholder="8-12"
                                    className="w-20 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-center focus:border-orange-500 outline-none font-bold"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-zinc-400 font-semibold block">Rest (s)</span>
                                  <input
                                    type="number"
                                    step="15"
                                    value={ex.rest_seconds}
                                    onChange={(e) =>
                                      updateExerciseField(
                                        day.day_number,
                                        exIdx,
                                        'rest_seconds',
                                        e.target.value
                                      )
                                    }
                                    className="w-16 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-center focus:border-orange-500 outline-none font-bold"
                                  />
                                </div>

                                {/* Reorder & Delete */}
                                <div className="flex items-center gap-1 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => moveExercise(day.day_number, exIdx, 'up')}
                                    disabled={exIdx === 0}
                                    className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveExercise(day.day_number, exIdx, 'down')}
                                    disabled={exIdx === day.exercises.length - 1}
                                    className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeExercise(day.day_number, exIdx)}
                                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors ml-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {exerciseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-zinc-900 dark:text-white text-base">Select Exercise</h3>
                <p className="text-xs text-zinc-500">Add to Day {targetDayNumber}</p>
              </div>
              <button
                onClick={() => setExerciseModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm px-2 py-1"
              >
                Cancel
              </button>
            </div>

            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name (e.g. bench press, squat, curl)..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {loadingExercises ? (
                <div className="py-12 flex items-center justify-center text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : exerciseList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  No exercises found.
                </div>
              ) : (
                exerciseList.map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => addExerciseToDay(exercise)}
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
                          {exercise.body_part} • {exercise.equipment || 'No equipment'}
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
