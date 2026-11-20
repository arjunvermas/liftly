import { useEffect } from 'react'
import { X, Dumbbell, Play, Sparkles } from 'lucide-react'
import ExerciseMedia from './ExerciseMedia'

export default function ExerciseDetailModal({ exercise, onClose, targets }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!exercise) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {exercise.body_part && (
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                  {exercise.body_part}
                </span>
              )}
              {exercise.equipment && (
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 capitalize bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                  {exercise.equipment}
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">
              {exercise.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Demo Media Area */}
        <div className="px-5">
          <div className="w-full h-72 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center relative border border-zinc-200/80 dark:border-zinc-800 shadow-inner">
            <ExerciseMedia
              imageUrl={exercise.image_url}
              gifUrl={exercise.gif_url}
              alt={exercise.name}
              autoPlayVideo={true}
              containerClassName="w-full h-full flex items-center justify-center"
              className="w-full h-full object-contain p-2"
            />
          </div>
          <p className="text-[11px] text-zinc-400 text-center mt-2 italic">
            Movement demonstration loop
          </p>
        </div>

        {/* Targets / Day Context */}
        {targets && (
          <div className="mx-5 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              Today's Target
            </span>
            <span className="text-sm font-black text-zinc-900 dark:text-white">
              {targets.target_sets} sets × {targets.target_reps} reps
              {targets.rest_seconds > 0 && ` • ${targets.rest_seconds}s rest`}
            </span>
          </div>
        )}

        {/* Target Muscles */}
        {exercise.target_muscles?.length > 0 && (
          <div className="px-5 pb-5">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
              Primary Target Muscles:
            </span>
            <div className="flex flex-wrap gap-2">
              {exercise.target_muscles.map((muscle, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold capitalize border border-zinc-200 dark:border-zinc-700/80"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
