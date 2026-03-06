import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AnimatedButton from '../components/AnimatedButton'
import AuthCard from '../components/AuthCard'
import AuthInput from '../components/AuthInput'
import api, { setAuthToken } from '../services/api'

const getErrorPayload = (error) => {
  const data = error?.response?.data
  const fieldErrors = {}

  if (Array.isArray(data?.errors)) {
    data.errors.forEach((entry) => {
      if (entry?.field) {
        fieldErrors[entry.field] = entry.message || 'Invalid value'
      }
    })
  }

  return {
    message: data?.message || 'Login failed. Please try again.',
    fieldErrors,
  }
}

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return

    const nextFieldErrors = {}
    if (!email.trim()) nextFieldErrors.email = 'Email is required'
    if (!password.trim()) nextFieldErrors.password = 'Password is required'

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors)
      setError('Please fix the highlighted fields.')
      return
    }

    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const response = await api.post('/api/users/login', {
        email: email.trim(),
        password,
      })

      const token = response?.data?.token
      if (!token) {
        setError('Authentication token was not received. Please try again.')
        setLoading(false)
        return
      }

      setAuthToken(token)
      navigate('/dashboard', { replace: true })
    } catch (apiError) {
      const parsed = getErrorPayload(apiError)
      setError(parsed.message)
      setFieldErrors(parsed.fieldErrors)
      setLoading(false)
    }
  }

  return (
    <Motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="auth-page-bg relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6"
    >
      <div className="auth-ambient-glow" />
      <div className="bg-particles" />

      <div className="relative z-10 w-full max-w-[500px]">
        <AuthCard
          title="Welcome Back"
          subtitle="Sign in to continue your Track2Hired journey"
          footer={
            <span>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-400 transition hover:text-blue-300">
                Register
              </Link>
            </span>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              icon={Mail}
              error={fieldErrors.email}
            />

            <AuthInput
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={loading}
              icon={Lock}
              error={fieldErrors.password}
              rightElement={
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  className="text-white/60 transition hover:text-blue-300 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <AnimatePresence>
              {error ? (
                <Motion.p
                  key={error}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                >
                  {error}
                </Motion.p>
              ) : null}
            </AnimatePresence>

            <AnimatedButton type="submit" loading={loading} disabled={!canSubmit || loading}>
              {loading ? 'Signing in...' : 'Login'}
            </AnimatedButton>
          </form>
        </AuthCard>
      </div>
    </Motion.section>
  )
}

export default Login
