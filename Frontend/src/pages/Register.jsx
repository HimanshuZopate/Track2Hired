import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
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
    message: data?.message || 'Registration failed. Please try again.',
    fieldErrors,
  }
}

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const canSubmit = useMemo(
    () => form.name.trim() && form.email.trim() && form.password.trim() && form.confirmPassword.trim(),
    [form],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.email.trim()) errors.email = 'Email is required'
    if (!form.password.trim()) errors.password = 'Password is required'
    if (!form.confirmPassword.trim()) errors.confirmPassword = 'Confirm your password'
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (form.password && form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    return errors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return

    const validationErrors = validate()
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors)
      setError('Please fix the highlighted fields.')
      return
    }

    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const response = await api.post('/api/users/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })

      const token = response?.data?.token
      if (!token) {
        setError('Registration completed but token was not received. Please login manually.')
        setLoading(false)
        navigate('/login', { replace: true })
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
          title="Create Account"
          subtitle="Start tracking your interview readiness"
          footer={
            <span>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-400 transition hover:text-blue-300">
                Login
              </Link>
            </span>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Name"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              disabled={loading}
              icon={User}
              error={fieldErrors.name}
            />

            <AuthInput
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={loading}
              icon={Mail}
              error={fieldErrors.email}
            />

            <AuthInput
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a secure password"
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

            <AuthInput
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={loading}
              icon={Lock}
              error={fieldErrors.confirmPassword}
              rightElement={
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={loading}
                  className="text-white/60 transition hover:text-blue-300 disabled:cursor-not-allowed"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <input type="hidden" name="role" value={form.role} />

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
              {loading ? 'Creating account...' : 'Register'}
            </AnimatedButton>
          </form>
        </AuthCard>
      </div>
    </Motion.section>
  )
}

export default Register
