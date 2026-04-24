import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AIPractice from './pages/AIPractice'
import Analytics from './pages/Analytics'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Skills from './pages/Skills'
import StreakDashboard from './pages/StreakDashboard'
import Tasks from './pages/Tasks'
import { getAuthToken } from './services/api'

import Practice from './pages/Practice'
import ResumeStudio from './pages/ResumeStudio'

function HomeRoute() {
  const token = getAuthToken()
  return <Navigate to={token ? '/dashboard' : '/login'} replace />
}

function ProtectedRoute({ children }) {
  const token = getAuthToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicOnlyRoute({ children }) {
  const token = getAuthToken()
  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skills"
          element={
            <ProtectedRoute>
              <Skills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-practice"
          element={
            <ProtectedRoute>
              <AIPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <Practice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume/*"
          element={
            <ProtectedRoute>
              <ResumeStudio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/streak"
          element={
            <ProtectedRoute>
              <StreakDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
