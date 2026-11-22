import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  Flame,
  AlertCircle,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import api from '../lib/api'
import ExerciseMedia from '../components/exercises/ExerciseMedia'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(totalSec) {
  const hrs = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatRest(seconds) {
  if (!seconds || seconds <= 0) return null
  if (seconds < 60) return `${seconds}s rest`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m}m ${s}s rest` : `${m}m rest`
}

function getTip(bodyPart) {
  const tips = {
    chest: "Keep your shoulder blades pinched together throughout the movement.",
    back: "Drive your elbows down and back — don't just pull with your hands.",
    shoulders: "Avoid shrugging your traps, keep them down and relaxed.",
    legs: "Keep your knees tracking over your toes. Control the descent.",
    biceps: "Keep your elbows pinned at your sides and avoid swinging.",
    triceps: "Lock your upper arms in place — only your forearms should move.",
    core: "Breathe out on the contraction. Keep your lower back pressed down.",
    cardio: "Maintain a pace where you can still talk, then push at the end.",
  }
  return tips[bodyPart?.toLowerCase()] ?? "Focus on controlled reps over speed — quality beats quantity."
}

// ─── Zoomed Exercise Card (expanded logging view) ────────────────────────────

function ExerciseLoggingPanel({ ex, exIdx, onClose, updateSetField, toggleSetComplete, addSetToExercise, removeSetFromExercise }) {
  const restLabel = formatRest(ex.restSeconds)
  const tip = getTip(ex.body_part)
  const completedCount = ex.sets.filter((s) => s.completed).length

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col overflow-y-auto"
      style={{ animation: 'zoomIn 0.22s cubic-bezier(0.34,1.4,0.64,1) both' }}
    >
      <style>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workout</span>
        </button>
        <span className="text-xs font-bold text-orange-400 bg-orange-500/15 border border-orange-500/25 px-3 py-1 rounded-full">
          {completedCount}/{ex.sets.length} sets done
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8 max-w-2xl mx-auto w-full space-y-5">

        {/* Exercise name + badges */}
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {ex.body_part && (
              <span className="text-[11px] font-bold text-orange-400 bg-orange-500/15 px-2.5 py-0.5 rounded-full border border-orange-500/25 capitalize">
                {ex.body_part}
              </span>
            )}
            {ex.equipment && (
              <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700 capitalize">
                {ex.equipment}
              </span>
            )}
          </div>
          <h2 className="text-white font-black text-2xl sm:text-3xl leading-tight">{ex.name}</h2>
        </div>

        {/* Big GIF demo */}
        <div className="w-full aspect-video rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shadow-2xl">
          <ExerciseMedia
            imageUrl={ex.image_url}
            gifUrl={ex.gif_url}
            alt={ex.name}
            autoPlayVideo={true}
            containerClassName="w-full h-full flex items-center justify-center"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Target + rest pills */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/25">
            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Target</p>
              <p className="text-white font-black text-base leading-tight">
                {ex.target_sets} <span className="text-zinc-400 font-semibold text-sm">×</span> {ex.target_reps}
                <span className="text-zinc-400 font-medium text-xs ml-1">reps</span>
              </p>
            </div>
          </div>
          {restLabel && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 border border-zinc-700">
              <Timer className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="text-zinc-200 text-sm font-bold">{restLabel}</span>
            </div>
          )}
        </div>

        {/* Target muscles */}
        {ex.target_muscles?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Muscles Worked</p>
            <div className="flex flex-wrap gap-2">
              {ex.target_muscles.map((m, i) => (
                <span key={i} className="px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold capitalize">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <p className="text-xs text-zinc-400 leading-relaxed">💡 {tip}</p>
        </div>

        {/* Sets logging */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Log Your Sets</p>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-zinc-500 px-2 tracking-wider">
            <span className="col-span-2 text-center">Set</span>
            <span className="col-span-3 text-center">Weight (kg)</span>
            <span className="col-span-3 text-center">Reps</span>
            <span className="col-span-2 text-center">RPE</span>
            <span className="col-span-2 text-center">Done</span>
          </div>

          {ex.sets.map((set, setIdx) => (
            <div
              key={setIdx}
              className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl border transition-all ${
                set.completed
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <span className="col-span-2 text-center font-black text-sm text-white">
                {set.set_number}
              </span>

              <div className="col-span-3">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={set.weight_kg}
                  onChange={(e) => updateSetField(exIdx, setIdx, 'weight_kg', e.target.value)}
                  className="w-full text-center py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="col-span-3">
                <input
                  type="number"
                  min="0"
                  value={set.reps}
                  onChange={(e) => updateSetField(exIdx, setIdx, 'reps', e.target.value)}
                  className="w-full text-center py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="—"
                  value={set.rpe}
                  onChange={(e) => updateSetField(exIdx, setIdx, 'rpe', e.target.value)}
                  className="w-full text-center py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="col-span-2 flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleSetComplete(exIdx, setIdx)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    set.completed
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
                {ex.sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSetFromExercise(exIdx, setIdx)}
                    className="text-zinc-600 hover:text-red-400 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => addSetToExercise(exIdx)}
            className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Add Set</span>
          </button>
        </div>

        {/* Close / done with this exercise */}
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-base transition-all shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>Done — Back to Workout</span>
        </button>
      </div>
    </div>
  )
}

// ─── Compact Exercise Row Card (collapsed view) ──────────────────────────────

function ExerciseRowCard({ ex, exIdx, index, onOpen, removeExerciseFromWorkout }) {
  const completedCount = ex.sets.filter((s) => s.completed).length
  const totalSets = ex.sets.length
  const allDone = completedCount === totalSets

  return (
    <div
      onClick={() => onOpen(exIdx)}
      className={`flex items-center gap-4 px-5 py-4 rounded-3xl border cursor-pointer group transition-all select-none shadow-sm ${
        allDone
          ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/5'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50'
      }`}
      style={{ animation: `fadeUp 0.3s ${index * 0.05}s both` }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Number badge */}
      <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 shadow-sm transition-all ${
        allDone
          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
          : 'bg-orange-500 text-white shadow-orange-500/30'
      }`}>
        {allDone ? <Check className="w-4 h-4 stroke-[3]" /> : index + 1}
      </span>

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center group-hover:border-orange-400/50 transition-colors">
        <ExerciseMedia
          imageUrl={ex.image_url}
          gifUrl={ex.gif_url}
          alt={ex.name}
          containerClassName="w-full h-full flex items-center justify-center pointer-events-none"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm leading-tight truncate transition-colors ${
          allDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white group-hover:text-orange-500'
        }`}>
          {ex.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {ex.body_part && (
            <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 capitalize">
              {ex.body_part}
            </span>
          )}
          <span className="text-[11px] text-zinc-400">
            {ex.target_sets} × {ex.target_reps} reps
          </span>
        </div>
      </div>

      {/* Progress pill */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
          allDone
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : completedCount > 0
            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
        }`}>
          {completedCount}/{totalSets}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); removeExerciseFromWorkout(exIdx) }}
          className="text-zinc-300 dark:text-zinc-700 hover:text-red-500 transition-colors p-0.5"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WorkoutPreviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dayId = searchParams.get('dayId')
  const queryClient = useQueryClient()

  // ── Timer ──
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const timerRef = useRef(null)
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isActive])

  // ── Active exercise zoom panel ──
  const [openIdx, setOpenIdx] = useState(null)

  // ── Workout state ──
  const [title, setTitle] = useState('Workout Session')
  const [notes, setNotes] = useState('')
  const [workoutExercises, setWorkoutExercises] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Add exercise search modal ──
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [exerciseQuery, setExerciseQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // ── Fetch program data ──
  const { data: activeData, isLoading } = useQuery({
    queryKey: ['activeProgram'],
    queryFn: async () => {
      try {
        const res = await api.get('/programs/active')
        return res.data.data
      } catch {
        return null
      }
    },
  })

  // ── Populate exercises from program ──
  useEffect(() => {
    if (!activeData || workoutExercises.length > 0) return
    let targetDay = null
    if (dayId && activeData.program?.program_days) {
      targetDay = activeData.program.program_days.find((d) => d.id === dayId)
    }
    if (!targetDay) targetDay = activeData.today
    if (!targetDay) return

    setTitle(targetDay.day_name || 'Workout Session')
    if (targetDay.program_day_exercises?.length) {
      const sorted = [...targetDay.program_day_exercises].sort((a, b) => a.order_index - b.order_index)
      const mapped = sorted.map((pde) => {
        const setsCount = pde.target_sets || 3
        const sets = Array.from({ length: setsCount }, (_, i) => ({
          set_number: i + 1,
          weight_kg: 0,
          reps: parseInt(pde.target_reps, 10) || 10,
          rpe: '',
          completed: false,
        }))
        return {
          exercise_id: pde.exercise?.id || pde.exercise_id,
          name: pde.exercise?.name || 'Exercise',
          body_part: pde.exercise?.body_part || '',
          equipment: pde.exercise?.equipment || '',
          target_muscles: pde.exercise?.target_muscles || [],
          image_url: pde.exercise?.image_url,
          gif_url: pde.exercise?.gif_url,
          target_sets: pde.target_sets,
          target_reps: pde.target_reps,
          restSeconds: pde.rest_seconds,
          sets,
        }
      })
      setWorkoutExercises(mapped)
    }
  }, [activeData, dayId])

  // ── Exercise search ──
  useEffect(() => {
    if (!searchModalOpen) return
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await api.get('/workouts', { params: { name: exerciseQuery, limit: 30 } })
        setSearchResults(res.data.data || [])
      } catch {
        // silent
      } finally {
        setSearchLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [exerciseQuery, searchModalOpen])

  // ── Workout mutations ──
  const addExerciseToWorkout = (exercise) => {
    setWorkoutExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        body_part: exercise.body_part || '',
        equipment: exercise.equipment || '',
        target_muscles: exercise.target_muscles || [],
        image_url: exercise.image_url,
        gif_url: exercise.gif_url,
        target_sets: 3,
        target_reps: 10,
        restSeconds: 60,
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
    setWorkoutExercises((prev) => prev.filter((_, i) => i !== index))
    if (openIdx === index) setOpenIdx(null)
  }

  const addSetToExercise = (exIdx) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex
        const last = ex.sets[ex.sets.length - 1]
        return {
          ...ex,
          sets: [...ex.sets, { set_number: ex.sets.length + 1, weight_kg: last?.weight_kg ?? 0, reps: last?.reps ?? 10, rpe: '', completed: false }],
        }
      })
    )
  }

  const removeSetFromExercise = (exIdx, setIdx) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex
        const filtered = ex.sets.filter((_, si) => si !== setIdx)
        return { ...ex, sets: filtered.map((s, si) => ({ ...s, set_number: si + 1 })) }
      })
    )
  }

  const updateSetField = (exIdx, setIdx, field, value) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex
        const sets = [...ex.sets]
        sets[setIdx] = { ...sets[setIdx], [field]: value }
        return { ...ex, sets }
      })
    )
  }

  const toggleSetComplete = (exIdx, setIdx) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex
        const sets = [...ex.sets]
        sets[setIdx] = { ...sets[setIdx], completed: !sets[setIdx].completed }
        return { ...ex, sets }
      })
    )
  }

  // ── Finish workout ──
  const handleFinishWorkout = async () => {
    setError('')
    const allSets = workoutExercises.flatMap((ex) =>
      ex.sets.map((s) => ({
        exercise_id: ex.exercise_id,
        set_number: s.set_number,
        reps: Number(s.reps) || 0,
        weight_kg: Number(s.weight_kg) || 0,
        rpe: s.rpe ? Number(s.rpe) : null,
      }))
    )
    if (allSets.length === 0) {
      setError('Add at least one exercise and set before finishing.')
      return
    }
    const payload = {
      program_day_id: dayId || null,
      title: title.trim() || 'Workout Session',
      duration_minutes: Math.max(1, Math.round(seconds / 60)),
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
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : 'Failed to save workout session')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Derived stats ──
  const totalSets = workoutExercises.reduce((s, e) => s + e.sets.length, 0)
  const completedSets = workoutExercises.reduce((s, e) => s + e.sets.filter((x) => x.completed).length, 0)
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  // ── Loading / no day state ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* ── Zoomed exercise panel (overlay) ── */}
      {openIdx !== null && workoutExercises[openIdx] && (
        <ExerciseLoggingPanel
          ex={workoutExercises[openIdx]}
          exIdx={openIdx}
          onClose={() => setOpenIdx(null)}
          updateSetField={updateSetField}
          toggleSetComplete={toggleSetComplete}
          addSetToExercise={addSetToExercise}
          removeSetFromExercise={removeSetFromExercise}
        />
      )}

      {/* ── Main scroll page ── */}
      <div className="max-w-2xl mx-auto space-y-5 pb-10">

        {/* Top bar: back + timer */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Workout</span>
          </button>

          {/* Live timer pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-orange-600 dark:text-orange-400 shadow-sm">
            <Timer className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>{formatTime(seconds)}</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className="ml-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Workout header card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                Workout Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl sm:text-2xl font-black text-zinc-900 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-orange-500 outline-none transition-colors py-0.5"
              />
            </div>
            <div className="p-2.5 bg-orange-500/10 rounded-2xl text-orange-500 shrink-0 mt-4">
              <Dumbbell className="w-5 h-5" />
            </div>
          </div>

          <textarea
            rows={1}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Session notes, how it felt, pump score..."
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />

          {/* Progress bar */}
          {totalSets > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-500 dark:text-zinc-400">{completedSets} of {totalSets} sets done</span>
                <span className="font-black text-orange-500">{progressPct}%</span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section label */}
        {workoutExercises.length > 0 && (
          <div className="flex items-center gap-3 px-1">
            <h2 className="text-zinc-900 dark:text-white font-extrabold text-sm uppercase tracking-wider">
              Tap an exercise to log it
            </h2>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>
        )}

        {/* Exercise cards */}
        <div className="space-y-3">
          {workoutExercises.map((ex, idx) => (
            <ExerciseRowCard
              key={ex.exercise_id + idx}
              ex={ex}
              exIdx={idx}
              index={idx}
              onOpen={setOpenIdx}
              removeExerciseFromWorkout={removeExerciseFromWorkout}
            />
          ))}

          {/* Add exercise button */}
          <button
            type="button"
            onClick={() => { setExerciseQuery(''); setSearchModalOpen(true) }}
            className="w-full py-4 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-zinc-900/40 text-zinc-500 hover:text-orange-500 text-sm font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
        </div>

        {/* Finish button */}
        <div className="pt-2 pb-4">
          <button
            type="button"
            onClick={handleFinishWorkout}
            disabled={submitting || workoutExercises.length === 0}
            className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base transition-all shadow-xl shadow-orange-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving Workout...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Complete &amp; Finish Workout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Add Exercise Search Modal ── */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-zinc-900 dark:text-white text-base">Add Exercise</h3>
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  autoFocus
                  value={exerciseQuery}
                  onChange={(e) => setExerciseQuery(e.target.value)}
                  placeholder="Search exercise..."
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {searchLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">No exercises found</div>
              ) : (
                searchResults.map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => addExerciseToWorkout(exercise)}
                    className="flex items-center justify-between gap-3 px-3 py-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ExerciseMedia
                        imageUrl={exercise.image_url}
                        gifUrl={exercise.gif_url}
                        alt={exercise.name}
                        containerClassName="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center"
                      />
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{exercise.name}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 capitalize">
                          {exercise.body_part}{exercise.equipment ? ` • ${exercise.equipment}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 shrink-0">
                      Add +
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
