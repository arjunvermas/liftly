import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

const BODY_PARTS = [
  '', 'back', 'cardio', 'chest', 'lower arms', 'lower legs',
  'neck', 'shoulders', 'upper arms', 'upper legs', 'waist',
]

export default function ExerciseFilters({ filters, onChange }) {
  const [nameInput, setNameInput] = useState(filters.name || '')
  const debounceRef = useRef(null)

  // Debounce name search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (nameInput !== filters.name) {
        onChange({ ...filters, name: nameInput, page: 1 })
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [nameInput])

  // Sync if external filters.name changes (e.g. clear)
  useEffect(() => {
    if (filters.name !== nameInput && filters.name === '') {
      setNameInput('')
    }
  }, [filters.name])

  const handleBodyPart = (e) => {
    onChange({ ...filters, body_part: e.target.value, page: 1 })
  }

  const handleEquipment = (e) => {
    onChange({ ...filters, equipment: e.target.value, page: 1 })
  }

  const hasActiveFilters = filters.name || filters.body_part || filters.equipment || filters.target_muscle

  const clearFilters = () => {
    setNameInput('')
    onChange({ name: '', body_part: '', target_muscle: '', equipment: '', page: 1 })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Name search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search exercises by name..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-8 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
          {nameInput && (
            <button
              onClick={() => setNameInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Body part select */}
        <div className="relative sm:w-48">
          <select
            value={filters.body_part || ''}
            onChange={handleBodyPart}
            className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 pr-8 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors capitalize cursor-pointer font-medium"
          >
            <option value="">All body parts</option>
            {BODY_PARTS.filter(Boolean).map((bp) => (
              <option key={bp} value={bp} className="capitalize">{bp}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        </div>

        {/* Equipment input */}
        <div className="relative sm:w-48">
          <input
            type="text"
            placeholder="Equipment (e.g. dumbbell)"
            value={filters.equipment || ''}
            onChange={handleEquipment}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Clear button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:text-orange-500 dark:text-zinc-400 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  )
}
