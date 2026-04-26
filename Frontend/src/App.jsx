import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AIPractice from './pages/AIPractice'
import Analytics from './pages/Analytics'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Skills from './pages/Skills'
import StreakDashboard from './pages/StreakDashboard'
import Tasks from './pages/Tasks'
import { getAuthToken } from './services/api'

import Landing from './pages/Landing'
import Practice from './pages/Practice'
import ResumeStudio from './pages/ResumeStudio'
import AboutUs from './pages/AboutUs'
import Careers from './pages/Careers'
import Blog from './pages/Blog'
import ContactUs from './pages/ContactUs'
import PrivacyPolicy from './pages/PrivacyPolicy'

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

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // 'auto' forces an instant jump to the top, acting like a fresh page load
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public landing & info pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Auth pages */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        {/* Protected app pages */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/ai-practice" element={<ProtectedRoute><AIPractice /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
        <Route path="/resume/*" element={<ProtectedRoute><ResumeStudio /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/streak" element={<ProtectedRoute><StreakDashboard /></ProtectedRoute>} />
        <Route path="/recruiter" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
