import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Dumbbell, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import api from '../lib/api'
import ExerciseCard from '../components/exercises/ExerciseCard'
import ExerciseFilters from '../components/exercises/ExerciseFilters'

export default function ExercisesPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    name: '',
    body_part: '',
    target_muscle: '',
    equipment: '',
    page: 1,
    limit: 24,
  })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['exercises', filters],
    queryFn: async () => {
      const params = {
        page: filters.page,
        limit: filters.limit,
      }
      if (filters.name?.trim()) params.name = filters.name.trim()
      if (filters.body_part) params.body_part = filters.body_part
      if (filters.target_muscle) params.target_muscle = filters.target_muscle
      if (filters.equipment) params.equipment = filters.equipment

      const res = await api.get('/workouts', { params })
      return res.data
    },
    keepPreviousData: true,
  })

  const exercises = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / filters.limit) || 1

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setFilters((prev) => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Exercise Library</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
              {total} Exercises
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse all exercises, filter by body part or muscle, or add your own custom movements.
          </p>
        </div>

        <button
          onClick={() => navigate('/exercises/new')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Exercise</span>
        </button>
      </div>

      {/* Filters Bar */}
      <ExerciseFilters filters={filters} onChange={handleFilterChange} />

      {/* Content State */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium">Loading exercises...</p>
        </div>
      ) : isError ? (
        <div className="py-16 text-center bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">
          Failed to load exercises: {error?.message || 'Server error'}
        </div>
      ) : exercises.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">No exercises found</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Try adjusting your search filters or create a custom movement.
            </p>
          </div>
          <button
            onClick={() => setFilters({ name: '', body_part: '', target_muscle: '', equipment: '', page: 1, limit: 24 })}
            className="text-xs font-bold text-orange-500 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          {/* Exercises Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-500 font-semibold">
                Page <span className="font-bold text-zinc-900 dark:text-white">{filters.page}</span> of{' '}
                <span className="font-bold text-zinc-900 dark:text-white">{totalPages}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
