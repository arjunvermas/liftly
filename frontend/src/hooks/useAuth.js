import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, profile, isAuthenticated, setAuth, logout, setLoading } = useAuthStore()

  const { data, isLoading: queryLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me')
        return res.data
      } catch (err) {
        if (err.response?.status === 401) {
          return null
        }
        throw err
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!queryLoading) {
      if (data?.data) {
        setAuth(data.data, data.profile || null)
<<<<<<< HEAD
      } else if (!isAuthenticated) {
        logout()
      }
    }
  }, [data, queryLoading, isError, isAuthenticated])
=======
      } else {
        logout()
      }
    }
  }, [data, queryLoading, isError])
>>>>>>> 97664f3cdafb1a57997f8fa9f8872b36c2c4dd31

  return { user, profile, isLoading: queryLoading, isAuthenticated }
}
