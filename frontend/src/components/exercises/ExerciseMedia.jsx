import { useState } from 'react'
import { Dumbbell, Play } from 'lucide-react'

export default function ExerciseMedia({
  imageUrl,
  gifUrl,
  alt = 'Exercise preview',
  className = 'w-full h-full object-contain',
  containerClassName = 'w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center relative group',
  showPlayBadge = false,
  autoPlayVideo = false,
}) {
  const [imgError, setImgError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [hovered, setHovered] = useState(false)

  const isVideoUrl = (url) =>
    url && (url.endsWith('.mp4') || url.includes('/videos/') || url.includes('GymvisualMP4') || url.includes('.webm'))

  // Prefer static image_url first for fast loading, fallback to gif_url
  const primaryImg = (!imgError && imageUrl && !isVideoUrl(imageUrl)) ? imageUrl : null
  const videoMedia = (!videoError && (isVideoUrl(gifUrl) ? gifUrl : (isVideoUrl(imageUrl) ? imageUrl : null)))
  const fallbackImg = (!imgError && gifUrl && !isVideoUrl(gifUrl)) ? gifUrl : null

  // If hovered or autoPlay, and video is available, play video
  const shouldPlayVideo = (hovered || autoPlayVideo) && videoMedia

  return (
    <div
      className={containerClassName}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {shouldPlayVideo ? (
        <video
          src={videoMedia}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className={className}
        />
      ) : primaryImg || fallbackImg ? (
        <img
          src={primaryImg || fallbackImg}
          alt={alt}
          loading="lazy"
          onError={() => setImgError(true)}
          className={className}
        />
      ) : videoMedia ? (
        <video
          src={videoMedia}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className={className}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800/80">
          <Dumbbell className="w-6 h-6" />
        </div>
      )}

      {showPlayBadge && videoMedia && !shouldPlayVideo && (
        <div className="absolute bottom-1 right-1 bg-black/70 text-orange-400 rounded-full p-0.5 pointer-events-none">
          <Play className="w-2.5 h-2.5 fill-orange-400" />
        </div>
      )}
    </div>
  )
}
