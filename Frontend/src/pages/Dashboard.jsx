import { motion as Motion } from 'framer-motion'
import { AlertTriangle, Flame, Gauge, Target } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AnimatedCounter from '../components/AnimatedCounter'
import CircularProgress from '../components/CircularProgress'
import DashboardCard from '../components/DashboardCard'
import Heatmap from '../components/Heatmap'
import Sidebar from '../components/Sidebar'
import SkillChart from '../components/SkillChart'
import SuggestionCard from '../components/SuggestionCard'
import api, { getAuthToken } from '../services/api'

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

const safeGet = async (url) => {
  try {
    const response = await api.get(url)
    return { data: response.data, error: '' }
  } catch (error) {
    return { data: null, error: error?.response?.data?.message || `Failed to load ${url}` }
  }
}

const toPercentFromConfidence = (value) => Math.round((Number(value || 0) / 5) * 100)

const buildHeatmap = (history = [], days = 112) => {
  const today = new Date()
  const byDate = history.reduce((acc, entry) => {
    const date = new Date(entry.activityDate || entry.createdAt).toISOString().slice(0, 10)
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  return Array.from({ length: days }, (_, idx) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - idx))
    const key = date.toISOString().slice(0, 10)
    return { date: key, count: byDate[key] || 0 }
  })
}

const buildSkillChartData = ({ skills = [], trends = [] }) => {
  const technicalSkills = skills.filter((s) => s.category === 'Technical')
  const communicationSkills = skills.filter((s) => s.category === 'HR' || s.category === 'Behavioral')

  const technicalBase = technicalSkills.length
    ? Math.round(technicalSkills.reduce((a, b) => a + toPercentFromConfidence(b.confidenceScore), 0) / technicalSkills.length)
    : 0

  const communicationBase = communicationSkills.length
    ? Math.round(
        communicationSkills.reduce((a, b) => a + toPercentFromConfidence(b.confidenceScore), 0) /
          communicationSkills.length,
      )
    : 0

  const lastSix = trends.slice(-6)
  let rolling = 0

  return lastSix.map((point) => {
    rolling += Number(point.averageDelta || 0)
    return {
      label: point.date?.slice(5) || 'N/A',
      technical: clamp(technicalBase + rolling * 10, 0, 100),
      problemSolving: clamp(50 + rolling * 12, 0, 100),
      communication: clamp(communicationBase + Number(point.updatesCount || 0) * 3, 0, 100),
    }
  })
}

function Dashboard() {
  const hasFetchedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [fatalError, setFatalError] = useState('')
  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [tasksMetrics, setTasksMetrics] = useState(null)
  const [readiness, setReadiness] = useState(null)
  const [streak, setStreak] = useState(null)
  const [history, setHistory] = useState([])
  const [analyticsSummary, setAnalyticsSummary] = useState(null)
  const [suggestion, setSuggestion] = useState('')
  const [suggestionError, setSuggestionError] = useState('')
  const [atsScore, setAtsScore] = useState(0)

  useEffect(() => {
    if (hasFetchedRef.current) {
      return
    }
    hasFetchedRef.current = true

    const loadDashboard = async () => {
      setLoading(true)
      setFatalError('')

      const token = getAuthToken()
      if (!token) {
        setAuthRequired(true)
        setLoading(false)
        return
      }

      const profileRes = await safeGet('/api/users/profile')
      if (!profileRes.data) {
        const authError =
          (profileRes.error || '').toLowerCase().includes('no token') ||
          (profileRes.error || '').toLowerCase().includes('not authorized')

        setFatalError(
          authError
            ? 'Your session is missing or expired. Please login again.'
            : profileRes.error ||
                'Backend is unreachable. Please start Backend server on http://localhost:5000 and refresh.',
        )
        setLoading(false)
        return
      }

      const [
        skillsRes,
        tasksRes,
        readinessRes,
        streakRes,
        historyRes,
        resumeRes,
        summaryRes,
        suggestionRes,
        trendsRes,
      ] = await Promise.all([
        safeGet('/api/skills'),
        safeGet('/api/tasks'),
        safeGet('/api/readiness'),
        safeGet('/api/streak'),
        safeGet('/api/streak/history'),
        safeGet('/api/resume'),
        safeGet('/api/analytics/summary'),
        safeGet('/api/suggestions/today'),
        safeGet('/api/analytics/trends'),
      ])

      setProfile(profileRes.data || null)

      const skillsData = skillsRes.data?.skills || []
      setSkills(skillsData)

      setTasksMetrics(tasksRes.data?.metrics || null)

      const readinessPayload = readinessRes.data?.readiness || skillsRes.data?.readiness || null
      setReadiness(readinessPayload)

      setStreak(streakRes.data?.streak || null)
      setHistory(historyRes.data?.history || [])

      const summary = summaryRes.data?.summary || null
      setAnalyticsSummary({ ...summary, trends: trendsRes.data?.trends || [] })

      if (suggestionRes.data?.suggestion?.suggestionText) {
        setSuggestion(suggestionRes.data.suggestion.suggestionText)
        setSuggestionError('')
      } else {
        setSuggestion('')
        setSuggestionError(suggestionRes.error || 'Suggestion unavailable right now.')
      }

      const resumeAts =
        resumeRes.data?.resume?.atsScore ||
        resumeRes.data?.latestDocument?.atsScore ||
        resumeRes.data?.atsScore ||
        null

      const fallbackAts =
        tasksRes.data?.metrics?.completedPercentage ??
        summary?.consistencyScore ??
        readinessPayload?.overallScore ??
        0

      setAtsScore(Math.round(Number(resumeAts ?? fallbackAts)))
      setLoading(false)
    }

    loadDashboard()
  }, [])

  const heatmapData = useMemo(() => buildHeatmap(history), [history])

  const chartData = useMemo(
    () => buildSkillChartData({ skills, trends: analyticsSummary?.trends || [] }),
    [analyticsSummary?.trends, skills],
  )

  if (fatalError) {
    return (
      <div className="min-h-screen bg-[#0F0F12] px-4 py-8 text-almond">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/40 bg-red-500/10 p-6">
          <p className="mb-2 flex items-center gap-2 text-lg font-semibold text-red-300">
            <AlertTriangle size={20} /> Failed to load dashboard
          </p>
          <p className="text-sm text-red-100/90">{fatalError}</p>
        </div>
      </div>
    )
  }

  if (authRequired) {
    return (
      <div className="min-h-screen bg-[#0F0F12] px-4 py-8 text-almond">
        <div className="mx-auto max-w-3xl rounded-2xl border border-blue-400/30 bg-blue-500/10 p-6">
          <p className="mb-2 text-lg font-semibold text-blue-200">Login required</p>
          <p className="text-sm text-blue-100/90">
            Please login first so the dashboard can securely load your profile, skills, tasks, and analytics.
          </p>
        </div>
      </div>
    )
  }

  const readinessScore = Math.round(Number(readiness?.overallScore || 0))

  return (
    <div className="relative min-h-screen bg-[#0F0F12] text-almond">
      <div className="bg-particles" />
      <Sidebar role={profile?.role || 'student'} />

      <Motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 pb-24 md:ml-64 md:pb-8"
      >
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-12">
            <DashboardCard className="lg:col-span-7" glow="purple">
              <p className="text-3xl font-bold leading-tight sm:text-5xl">
                Welcome Back, {profile?.name || 'Professional'}
              </p>
            </DashboardCard>

            <DashboardCard className="lg:col-span-2" glow="amber">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Current Streak</p>
                <Flame size={16} className="text-amber-300" />
              </div>
              <p className="mt-3 text-4xl font-bold text-amber-200">
                <AnimatedCounter value={streak?.currentStreak || 0} />
                <span className="ml-1 text-xl">🔥</span>
              </p>
              <p className="text-sm text-white/70">Days</p>
            </DashboardCard>

            <DashboardCard className="lg:col-span-3" glow="blue">
              <p className="mb-2 text-sm text-white/75">Readiness Score</p>
              <div className="mx-auto flex justify-center">
                <CircularProgress value={readinessScore} label="Job Ready" size={180} />
              </div>
            </DashboardCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <DashboardCard className="lg:col-span-6" glow="blue">
              <p className="mb-4 text-2xl font-semibold">Skill Confidence</p>
              <div className="overflow-x-auto scrollbar-neon pb-1">
                <SkillChart data={chartData} loading={loading} />
              </div>
            </DashboardCard>

            <DashboardCard className="lg:col-span-6" glow="emerald">
              <p className="mb-2 text-2xl font-semibold">ATS Score</p>
              <div className="mt-4 flex flex-col items-center justify-center gap-4">
                <CircularProgress
                  value={atsScore}
                  label={atsScore >= 75 ? 'Great Match!' : 'Keep Optimizing'}
                  subtitle="Based on latest available resume/task analytics"
                  size={200}
                />
                <div className="grid w-full grid-cols-3 gap-2 text-center text-xs text-white/70">
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
                    <p className="text-white/60">Tasks Done</p>
                    <p className="text-base font-semibold text-emerald-300">
                      <AnimatedCounter value={tasksMetrics?.completedTasks || 0} />
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
                    <p className="text-white/60">Total Tasks</p>
                    <p className="text-base font-semibold text-blue-300">
                      <AnimatedCounter value={tasksMetrics?.totalTasks || 0} />
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
                    <p className="text-white/60">Consistency</p>
                    <p className="text-base font-semibold text-purple-300">
                      <AnimatedCounter value={analyticsSummary?.consistencyScore || 0} suffix="%" />
                    </p>
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>

          <DashboardCard glow="purple">
            <p className="mb-4 text-2xl font-semibold">Weekly Activity</p>
            <Heatmap data={heatmapData} loading={loading} />
          </DashboardCard>

          <SuggestionCard suggestion={suggestion} loading={loading} error={suggestionError} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard glow="blue">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Gauge size={15} /> Improvement Rate
              </div>
              <p className="mt-2 text-3xl font-bold text-blue-300">
                <AnimatedCounter value={analyticsSummary?.improvementRate || 0} suffix="%" />
              </p>
            </DashboardCard>

            <DashboardCard glow="purple">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Target size={15} /> Longest Streak
              </div>
              <p className="mt-2 text-3xl font-bold text-purple-300">
                <AnimatedCounter value={streak?.longestStreak || 0} /> days
              </p>
            </DashboardCard>

            <DashboardCard glow="emerald">
              <p className="text-sm text-white/70">Weak Skills</p>
              <ul className="mt-2 space-y-1 text-sm text-emerald-200">
                {(analyticsSummary?.weakestSkills || []).length ? (
                  analyticsSummary.weakestSkills.map((skill) => <li key={skill}>• {skill}</li>)
                ) : (
                  <li className="text-white/55">No weak skill signal available.</li>
                )}
              </ul>
            </DashboardCard>

            <DashboardCard glow="amber">
              <p className="text-sm text-white/70">Readiness Snapshot</p>
              <p className="mt-2 text-3xl font-bold text-amber-300">
                <AnimatedCounter value={readinessScore} suffix="%" />
              </p>
            </DashboardCard>
          </div>
        </div>
      </Motion.main>
    </div>
  )
}

export default Dashboard
