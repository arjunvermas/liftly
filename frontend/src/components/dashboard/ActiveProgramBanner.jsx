import { useNavigate } from 'react-router-dom'
import { CalendarDays, Dumbbell, ArrowRight } from 'lucide-react'

export default function ActiveProgramBanner({ program, startedAt }) {
  const navigate = useNavigate()

  const formattedStart = startedAt
    ? new Date(startedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  return (
<<<<<<< HEAD
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-6 sm:p-7 shadow-lg shadow-orange-500/20 border border-orange-400/30">
=======
    <div className="program-banner relative overflow-hidden rounded-3xl p-6 sm:p-7 border">
>>>>>>> 97664f3cdafb1a57997f8fa9f8872b36c2c4dd31
      {/* Decorative background shapes */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -right-4 -bottom-10 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
<<<<<<< HEAD
          <span className="inline-block text-orange-100 text-[11px] uppercase tracking-widest font-black bg-black/15 px-2.5 py-0.5 rounded-full mb-2">
            Active Program
          </span>
          <h2 className="text-white text-xl sm:text-2xl font-black leading-snug">
            {program?.title ?? 'Active Program'}
          </h2>

          <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-orange-100 font-semibold mt-3">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
              <Dumbbell className="w-4 h-4" />
              <span>{program?.days_per_week ?? '?'} days / week</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
=======
          <span className="banner-chip banner-muted inline-block text-[11px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full mb-2">
            Active Program
          </span>
          <h2 className="banner-title text-xl sm:text-2xl font-black leading-snug">
            {program?.title ?? 'Active Program'}
          </h2>

          <div className="banner-muted flex flex-wrap gap-4 text-xs sm:text-sm font-semibold mt-3">
            <span className="banner-chip flex items-center gap-1.5 px-3 py-1 rounded-lg">
              <Dumbbell className="w-4 h-4" />
              <span>{program?.days_per_week ?? '?'} days / week</span>
            </span>
            <span className="banner-chip flex items-center gap-1.5 px-3 py-1 rounded-lg">
>>>>>>> 97664f3cdafb1a57997f8fa9f8872b36c2c4dd31
              <CalendarDays className="w-4 h-4" />
              <span>Started {formattedStart}</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/programs')}
<<<<<<< HEAD
          className="self-start sm:self-auto shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-black/20 hover:bg-black/30 px-3.5 py-2 rounded-xl transition-all shadow-sm"
=======
          className="banner-btn self-start sm:self-auto shrink-0 flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all active:scale-[0.98]"
>>>>>>> 97664f3cdafb1a57997f8fa9f8872b36c2c4dd31
        >
          <span>Change Program</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
