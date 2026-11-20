import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Dumbbell,
  Film,
  Image as ImageIcon,
} from 'lucide-react'
import api from '../lib/api'

const BODY_PARTS = [
  'back',
  'cardio',
  'chest',
  'lower arms',
  'lower legs',
  'neck',
  'shoulders',
  'upper arms',
  'upper legs',
  'waist',
]

const COMMON_EQUIPMENT = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'smith machine',
  'band',
  'none',
]

export default function CreateExercisePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    body_part: 'chest',
    equipment: 'dumbbell',
  })

  const [muscleInput, setMuscleInput] = useState('')
  const [targetMuscles, setTargetMuscles] = useState(['pectorals'])

  // File uploads
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)

  const handleAddMuscle = () => {
    const trimmed = muscleInput.trim().toLowerCase()
    if (trimmed && !targetMuscles.includes(trimmed)) {
      setTargetMuscles([...targetMuscles, trimmed])
      setMuscleInput('')
    }
  }

  const handleRemoveMuscle = (muscle) => {
    setTargetMuscles(targetMuscles.filter((m) => m !== muscle))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Exercise name is required')
      return
    }

    if (targetMuscles.length === 0) {
      setError('Please specify at least one target muscle')
      return
    }

    const formData = new FormData()
    formData.append('name', form.name.trim())
    formData.append('body_part', form.body_part)
    formData.append('equipment', form.equipment)
    formData.append('target_muscles', JSON.stringify(targetMuscles))

    if (imageFile) formData.append('image', imageFile)
    if (videoFile) formData.append('video', videoFile)

    setLoading(true)
    try {
      await api.post('/workouts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/exercises')
    } catch (err) {
      console.error('Create exercise error:', err)
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to create exercise'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/exercises')}
        className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Exercises</span>
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
          <span>Create Custom Exercise</span>
          <Dumbbell className="w-6 h-6 text-orange-500" />
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Add a movement to the exercise library with media, muscles, and equipment details.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-sm transition-colors">
          {/* Exercise Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Exercise Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Incline Dumbbell Press"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Body Part & Equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Body Part *
              </label>
              <select
                value={form.body_part}
                onChange={(e) => setForm({ ...form, body_part: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 capitalize cursor-pointer font-medium"
              >
                {BODY_PARTS.map((bp) => (
                  <option key={bp} value={bp} className="capitalize">
                    {bp}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Equipment *
              </label>
              <select
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 capitalize cursor-pointer font-medium"
              >
                {COMMON_EQUIPMENT.map((eq) => (
                  <option key={eq} value={eq} className="capitalize">
                    {eq}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Muscles Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Target Muscles *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={muscleInput}
                onChange={(e) => setMuscleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddMuscle()
                  }
                }}
                placeholder="Type muscle name & press Add (e.g. triceps)"
                className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleAddMuscle}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-sm rounded-xl transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {targetMuscles.map((muscle) => (
                <span
                  key={muscle}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold capitalize"
                >
                  <span>{muscle}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMuscle(muscle)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Media Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                <span>Thumbnail Image</span>
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 rounded-2xl cursor-pointer bg-zinc-50 dark:bg-zinc-800/40 transition-colors group h-36 overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center space-y-1">
                    <Upload className="w-6 h-6 text-zinc-400 group-hover:text-orange-500 mx-auto transition-colors" />
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Upload Photo</p>
                    <p className="text-[10px] text-zinc-400">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Video / GIF upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-4 h-4 text-orange-500" />
                <span>Demo Video / GIF</span>
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 rounded-2xl cursor-pointer bg-zinc-50 dark:bg-zinc-800/40 transition-colors group h-36 overflow-hidden">
                {videoPreview ? (
                  <video
                    src={videoPreview}
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center space-y-1">
                    <Upload className="w-6 h-6 text-zinc-400 group-hover:text-orange-500 mx-auto transition-colors" />
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Upload Video / GIF</p>
                    <p className="text-[10px] text-zinc-400">MP4, GIF up to 25MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*,image/gif"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading & Creating Exercise...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Create Exercise</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
