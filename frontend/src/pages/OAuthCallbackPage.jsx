import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { account } from '../lib/appwrite'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()
  const [errorMsg, setErrorMsg] = useState('')
  const [statusText, setStatusText] = useState('Verifying your Google session...')
  const ran = useRef(false)

  const processOAuth = async () => {
    setErrorMsg('')
    setStatusText('Verifying your Google session...')

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const userId = urlParams.get('userId')
      const secret = urlParams.get('secret')

      // The OAuth2Session redirect has already created the Appwrite session.
      // Do not call createSession here, because recreating it can return
      // user_already_exists / 409 for an existing Appwrite account.

      // Step 1: Request JWT from the existing Appwrite client session
      setStatusText('Generating security token...')
      let jwt = null
      try {
        jwt = await account.createJWT()
      } catch (jwtErr) {
        console.error('Appwrite createJWT error:', jwtErr)
        throw new Error(
          jwtErr?.message || 'Could not verify Appwrite account session. Please ensure third-party cookies or popups are not blocked.'
        )
      }

      if (!jwt?.jwt) {
        throw new Error('Received an empty authorization token from Appwrite.')
      }

      // Step 2: Send JWT to backend for user sync & 30-day session cookie issue
      setStatusText('Syncing profile with database...')
      const { data } = await api.post('/auth/google', { appwriteJwt: jwt.jwt })

      const user = data.data || data.user
      const profile = data.profile || null

      if (user) {
        setAuth(user, profile)
      }

      // OAuth and `/me` both establish the same user session.
      // Set it immediately, then refresh `/me` from the dashboard.

      // Invalidate queries so dashboard data is immediately fresh
      queryClient.invalidateQueries(['user.me'])
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['activeProgram'] })

      // Step 3: Navigate to onboarding or dashboard
      if (data.isNewUser && !data.hasProfile) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      console.error('OAuth callback execution error:', err)
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Google authentication failed. Please try again.'
      setErrorMsg(msg)
    }
  }

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    processOAuth()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
        {errorMsg ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                Sign In Failed
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                {errorMsg}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => processOAuth()}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Verification</span>
              </button>

              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                Authenticating with Google
              </h2>
              <p className="text-xs text-zinc-400 mt-1">{statusText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
