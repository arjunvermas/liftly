import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'

// Layout & Protected Route
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ui/ProtectedRoute'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'

import DashboardPage from './pages/DashboardPage'
import ProgramsPage from './pages/ProgramsPage'
import CreateProgramPage from './pages/CreateProgramPage'
import ProgramDetailPage from './pages/ProgramDetailPage'
import ExercisesPage from './pages/ExercisesPage'
import CreateExercisePage from './pages/CreateExercisePage'
import HistoryPage from './pages/HistoryPage'
import SessionDetailPage from './pages/SessionDetailPage'
import WorkoutPreviewPage from './pages/WorkoutPreviewPage'
import ProfilePage from './pages/ProfilePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
})

function AppRoutes() {
  // Initialize and sync current user authentication
  useAuth()

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      {/* Protected App Routes inside Main Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/new" element={<CreateProgramPage />} />
          <Route path="/programs/:id" element={<ProgramDetailPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/new" element={<CreateExercisePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<SessionDetailPage />} />
          <Route path="/workout-preview" element={<WorkoutPreviewPage />} />
          <Route path="/log" element={<WorkoutPreviewPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
