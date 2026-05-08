import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { getAuthToken } from './services/api'
import ErrorBoundary from './components/ErrorBoundary'

// ─── Lazy-loaded pages (code-split per route) ─────────────────────────────────
const AIPractice = lazy(() => import('./pages/AIPractice'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Skills = lazy(() => import('./pages/Skills'))
const StreakDashboard = lazy(() => import('./pages/StreakDashboard'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Landing = lazy(() => import('./pages/Landing'))
const ResumeStudio = lazy(() => import('./pages/ResumeStudio'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Careers = lazy(() => import('./pages/Careers'))
const Blog = lazy(() => import('./pages/Blog'))
const ContactUs = lazy(() => import('./pages/ContactUs'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))

// ─── Page loader (shown while lazy chunks load) ──────────────────────────────
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F0F12]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        <p className="text-sm text-white/40">Loading…</p>
      </div>
    </div>
  )
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
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/resume/*" element={<ProtectedRoute><ResumeStudio /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/streak" element={<ProtectedRoute><StreakDashboard /></ProtectedRoute>} />
            <Route path="/recruiter" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
