import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar, Zap, CheckCircle, ChevronRight, Loader2, Dumbbell, Sparkles } from 'lucide-react'
import api from '../lib/api'

const fetchPrograms = async () => {
  const res = await api.get('/programs')
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

export default function ProgramsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activatingId, setActivatingId] = useState(null)

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
  })

  const { data: activeProgram } = useQuery({
    queryKey: ['activeProgram'],
    queryFn: fetchActiveProgram,
  })

  const activateMutation = useMutation({
    mutationFn: (id) => api.post(`/programs/${id}/activate`),
    onMutate: (id) => setActivatingId(id),
    onSettled: () => {
      setActivatingId(null)
      queryClient.invalidateQueries({ queryKey: ['activeProgram'] })
      queryClient.invalidateQueries({ queryKey: ['programs'] })
    },
  })

  const isActive = (program) => activeProgram?.program?.id === program.id

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Workout Programs</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
              {programs.length} Splits
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Choose a training split to follow or design your own customized routine.
          </p>
        </div>

        <button
          onClick={() => navigate('/programs/new')}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/20 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Program</span>
        </button>
      </div>

      {/* Programs Grid */}
      {programsLoading ? (
        <div className="flex items-center justify-center py-24 text-zinc-400">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-4">
          <Dumbbell className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto" />
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">No programs found</h3>
          <p className="text-sm text-zinc-500">Create your first custom workout program to get started!</p>
          <button
            onClick={() => navigate('/programs/new')}
            className="text-sm font-bold text-orange-500 hover:underline"
          >
            + Create New Program
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((program) => {
            const active = isActive(program)
            const isActivating = activatingId === program.id

            return (
              <div
                key={program.id}
                className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-lg ${
                  active
                    ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-orange-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                      <Calendar className="w-3.5 h-3.5" />
                      {program.days_per_week} days/week
                    </span>
                    {active && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight mb-2">
                    {program.title}
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-6">
                    {program.description || 'Custom workout split configured with targeted exercise days.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => navigate(`/programs/${program.id}`)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 py-2.5 rounded-xl transition-colors"
                  >
                    <span>View Split</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {!active && (
                    <button
                      onClick={() => activateMutation.mutate(program.id)}
                      disabled={isActivating}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-2.5 rounded-xl transition-all shadow-sm shadow-orange-500/20"
                    >
                      {isActivating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>Activate</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
