export default function StatsCard({ icon: Icon, label, value, sub }) {
  return (
<<<<<<< HEAD
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-start gap-4 shadow-sm transition-colors">
      <div className="p-2.5 bg-orange-500/10 rounded-xl shrink-0 border border-orange-500/20">
        {Icon && <Icon className="w-5 h-5 text-orange-500" />}
=======
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-start gap-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10 dark:hover:shadow-[0_18px_45px_-24px_rgba(var(--accent-glow),0.8)]">
      <div className="p-2.5 bg-orange-500/10 rounded-xl shrink-0 border border-orange-500/20 transition-all duration-300 group-hover:bg-orange-500/20 group-hover:shadow-[0_0_22px_-8px_rgba(var(--accent-glow),0.9)]">
        {Icon && <Icon className="w-5 h-5 text-orange-500 transition-transform duration-300 group-hover:scale-110" />}
>>>>>>> 97664f3cdafb1a57997f8fa9f8872b36c2c4dd31
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold mb-0.5">
          {label}
        </p>
        <p className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
