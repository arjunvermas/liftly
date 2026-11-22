import { useState } from 'react'
import { Trash2, Dumbbell, Play, Maximize2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import ExerciseMedia from './ExerciseMedia'
import ExerciseDetailModal from './ExerciseDetailModal'

export default function ExerciseCard({ exercise }) {
  const { id, name, body_part, target_muscles, equipment, gif_url, image_url } = exercise
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/workouts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })

  const handleDelete = (e) => {
    e.stopPropagation()
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    deleteMutation.mutate()
    setConfirmDelete(false)
  }

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        onMouseLeave={() => setConfirmDelete(false)}
<<<<<<< HEAD
        className="relative group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 shadow-sm cursor-pointer select-none active:scale-[0.99]"
=======
        className="relative group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/15 dark:hover:shadow-[0_22px_50px_-26px_rgba(var(--accent-glow),0.85)] shadow-sm cursor-pointer select-none active:scale-[0.99]"
>>>>>>> 97664f3cdafb1a57997f8fa9f8872b36c2c4dd31
        title="Click to view full exercise demo & details"
      >
        {/* Media area */}
        <div className="relative h-48 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-100 dark:border-zinc-800">
          <ExerciseMedia
            imageUrl={image_url}
            gifUrl={gif_url}
            alt={name}
            showPlayBadge={true}
            containerClassName="w-full h-full flex items-center justify-center relative overflow-hidden pointer-events-none"
            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />

          {/* Quick preview hover badge */}
          <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Maximize2 className="w-2.5 h-2.5" />
            <span>Click to expand</span>
          </div>

          {/* Delete action button */}
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-md transition-colors ${
                confirmDelete
                  ? 'bg-red-500 text-white'
                  : 'bg-white/95 dark:bg-zinc-900/95 hover:bg-red-500 text-zinc-700 dark:text-zinc-300 hover:text-white border border-zinc-200 dark:border-zinc-700'
              }`}
              title={confirmDelete ? 'Click again to confirm' : 'Delete exercise'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmDelete ? 'Confirm?' : ''}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2.5 flex-1 bg-white dark:bg-zinc-900">
          <h3 className="text-zinc-900 dark:text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
            {name}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {body_part && (
              <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] px-2 py-0.5 rounded-md border border-orange-500/20 font-semibold capitalize">
                {body_part}
              </span>
            )}
            {equipment && (
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 capitalize font-medium">
                {equipment}
              </span>
            )}
          </div>

          {target_muscles && target_muscles.length > 0 && (
            <div className="mt-auto pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
              <p className="text-zinc-400 dark:text-zinc-500 text-[10px] mb-1 uppercase tracking-wider font-bold">
                Targets
              </p>
              <div className="flex flex-wrap gap-1">
                {target_muscles.slice(0, 3).map((muscle, i) => (
                  <span
                    key={i}
                    className="text-zinc-600 dark:text-zinc-300 text-[10px] bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded capitalize"
                  >
                    {muscle}
                  </span>
                ))}
                {target_muscles.length > 3 && (
                  <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">
                    +{target_muscles.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details & Video Modal */}
      {modalOpen && (
        <ExerciseDetailModal
          exercise={exercise}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
