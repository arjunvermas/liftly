import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 'md', fullPage = false, text }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size] || 'w-8 h-8'

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses} text-orange-500 animate-spin`} />
      {text && <p className="text-sm text-zinc-400 font-medium">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
