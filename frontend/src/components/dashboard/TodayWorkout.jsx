import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, ChevronRight, Layers, Dumbbell } from 'lucide-react'
import ExerciseMedia from '../exercises/ExerciseMedia'
import ExerciseDetailModal from '../exercises/ExerciseDetailModal'

export default function TodayWorkout({ today, currentDayNumber }) {
  const navigate = useNavigate()
  const [selectedExerciseData, setSelectedExerciseData] = useState(null)

  if (!today) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-center text-zinc-500 shadow-sm">
        <Layers className="w-8 h-8 mx-auto mb-2 text-zinc-400 dark:text-zinc-600" />
        <p className="text-sm font-medium">No workout scheduled for today.</p>
      </div>
    )
  }

  const exercises = today.program_day_exercises ?? []

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/60 dark:bg-zinc-900/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                Day {currentDayNumber}
              </span>
            </div>
            <h3 className="text-zinc-900 dark:text-white font-extrabold text-lg sm:text-xl leading-tight">
              {today.day_name}
            </h3>
            {today.focus && (
              <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5 capitalize">
                Focus: {today.focus} • {exercises.length} Exercises to hit
              </p>
            )}
          </div>

          <button
            onClick={() => navigate(`/workout-preview?dayId=${today.id}`)}
            className="shrink-0 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/20"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Workout</span>
          </button>
        </div>

        {/* Exercise list */}
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {exercises
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .map((item, idx) => {
              const ex = item.exercise ?? {}
              return (
                <li
                  key={item.id || idx}
                  onClick={() => setSelectedExerciseData({ exercise: ex, targets: item })}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer select-none"
                  title="Click to view full exercise demo & target sets"
                >
                  {/* Thumbnail with hover animation */}
                  <ExerciseMedia
                    imageUrl={ex.image_url}
                    gifUrl={ex.gif_url}
                    alt={ex.name}
                    showPlayBadge={true}
                    containerClassName="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm group-hover:border-orange-500/50 transition-colors pointer-events-none"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-900 dark:text-white text-sm font-bold truncate group-hover:text-orange-500 transition-colors">
                      {ex.name ?? 'Exercise'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                      {ex.body_part && (
                        <span className="text-orange-600 dark:text-orange-400 font-semibold capitalize bg-orange-500/10 px-2 py-0.5 rounded text-[11px]">
                          {ex.body_part}
                        </span>
                      )}
                      {ex.equipment && (
                        <span className="text-zinc-500 dark:text-zinc-400 capitalize text-[11px]">
                          • {ex.equipment}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Target Sets x Reps */}
                  <div className="text-right shrink-0">
                    <span className="text-orange-600 dark:text-orange-400 font-black text-sm">
                      {item.target_sets} × {item.target_reps}
                    </span>
                    {item.rest_seconds > 0 && (
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-0.5">
                        {item.rest_seconds}s rest
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </li>
              )
            })}
        </ul>

        {exercises.length === 0 && (
          <p className="text-center text-zinc-400 text-sm py-8">
            No exercises added for this day.
          </p>
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
