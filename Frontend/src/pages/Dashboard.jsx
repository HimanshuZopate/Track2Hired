import { motion as Motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ActionCenter from '../components/dashboard/ActionCenter'
import InsightStrip from '../components/dashboard/InsightStrip'
import ProgressPanel from '../components/dashboard/ProgressPanel'
import StatusBar from '../components/dashboard/StatusBar'
import { dashboardApi, getAuthToken } from '../services/api'

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

const safeCall = async (request) => {
  try {
    const response = await request()
    return { data: response.data, error: '' }
  } catch (error) {
    return { data: null, error: error?.response?.data?.message || 'Request failed' }
  }
}

const toPercentFromConfidence = (value) => Math.round((Number(value || 0) / 5) * 100)

const buildRadarData = (skills = []) => {
  if (!skills.length) return []

  const grouped = skills.reduce((acc, skill) => {
    const key = skill.category || 'General'
    if (!acc[key]) {
      acc[key] = { total: 0, count: 0 }
    }
    acc[key].total += toPercentFromConfidence(skill.confidenceScore)
    acc[key].count += 1
    return acc
  }, {})

  return Object.entries(grouped).map(([category, val]) => ({
    subject: category,
    score: Math.round(val.total / val.count),
  }))
}

const buildConsistencyData = (trends = []) =>
  trends.slice(-8).map((point) => ({
    label: point.date?.slice(5) || 'N/A',
    score: clamp(Math.round(40 + Number(point.updatesCount || 0) * 9 + Number(point.averageDelta || 0) * 24), 0, 100),
  }))

const buildTimeline = (history = []) =>
  history.slice(0, 8).map((event) => ({
    type: event.activityType,
    label: event.activityType === 'TaskComplete' ? 'Completed a task milestone' : 'Updated a skill confidence signal',
    date: new Date(event.activityDate || event.createdAt).toLocaleDateString(),
  }))

const buildTrendData = (trends = [], readiness = 0) => {
  let rolling = Number(readiness || 0)

  return trends.slice(-10).map((point) => {
    rolling = clamp(rolling + Number(point.averageDelta || 0) * 8 + Number(point.updatesCount || 0) * 1.2, 0, 100)
    return {
      label: point.date?.slice(5) || 'N/A',
      score: Math.round(rolling),
    }
  })
}

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [fatalError, setFatalError] = useState('')
  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [tasks, setTasks] = useState([])
  const [readiness, setReadiness] = useState(null)
  const [streak, setStreak] = useState(null)
  const [history, setHistory] = useState([])
  const [analyticsSummary, setAnalyticsSummary] = useState(null)
  const [suggestion, setSuggestion] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setFatalError('')

      const token = getAuthToken()
      if (!token) {
        setAuthRequired(true)
        setLoading(false)
        return
      }

      const profileRes = await safeCall(dashboardApi.getProfile)
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
        summaryRes,
        suggestionRes,
        trendsRes,
      ] = await Promise.all([
        safeCall(dashboardApi.getSkills),
        safeCall(dashboardApi.getTasks),
        safeCall(dashboardApi.getReadiness),
        safeCall(dashboardApi.getStreak),
        safeCall(dashboardApi.getStreakHistory),
        safeCall(dashboardApi.getAnalyticsSummary),
        safeCall(dashboardApi.getSuggestions),
        safeCall(dashboardApi.getTrends),
      ])

      setProfile(profileRes.data || null)

      const skillsData = skillsRes.data?.skills || []
      setSkills(skillsData)

      setTasks(tasksRes.data?.tasks || [])

      const readinessPayload = readinessRes.data?.readiness || skillsRes.data?.readiness || null
      setReadiness(readinessPayload)

      setStreak(streakRes.data?.streak || null)
      setHistory(historyRes.data?.history || [])

      const summary = summaryRes.data?.summary || null
      setAnalyticsSummary({ ...summary, trends: trendsRes.data?.trends || [] })

      if (suggestionRes.data?.suggestion?.suggestionText) {
        setSuggestion(suggestionRes.data.suggestion.suggestionText)
      } else {
        const fallback = await safeCall(dashboardApi.getTodaySuggestion)
        setSuggestion(fallback.data?.suggestion?.suggestionText || '')
      }
      setLoading(false)
    }

    loadDashboard()
  }, [])

  const readinessScore = Math.round(Number(readiness?.overallScore || 0))
  const radarData = useMemo(() => buildRadarData(skills), [skills])
  const consistencyData = useMemo(() => buildConsistencyData(analyticsSummary?.trends || []), [analyticsSummary?.trends])
  const timelineData = useMemo(() => buildTimeline(history), [history])
  const trendData = useMemo(
    () => buildTrendData(analyticsSummary?.trends || [], readinessScore),
    [analyticsSummary?.trends, readinessScore],
  )

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'Completed'),
    [tasks],
  )

  const todayFocus = useMemo(() => {
    const weak = analyticsSummary?.weakestSkills?.[0]
    if (weak) return `Strengthen ${weak}`
    if ((pendingTasks || []).length) return `Close ${pendingTasks[0].title}`
    return 'Ship one measurable improvement'
  }, [analyticsSummary?.weakestSkills, pendingTasks])

  const tickerItems = (() => {
    const items = []
    if (analyticsSummary?.improvementRate !== undefined) {
      items.push(`Improvement rate ${Math.round(analyticsSummary.improvementRate)}% this cycle`)
    }
    if (analyticsSummary?.consistencyScore !== undefined) {
      items.push(`Consistency index ${Math.round(analyticsSummary.consistencyScore)}%`) 
    }
    if ((analyticsSummary?.weakestSkills || []).length) {
      items.push(`Priority weak skill: ${analyticsSummary.weakestSkills[0]}`)
    }
    if (suggestion) {
      items.push(suggestion)
    }
    return items
  })()

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

  return (
    <div className="mission-dashboard">
      <div className="mission-bg-orb orb-blue" />
      <div className="mission-bg-orb orb-purple" />
      <div className="mission-bg-orb orb-emerald" />
      <Sidebar role={profile?.role || 'student'} />

      <Motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 pb-24 md:ml-64 md:pb-8"
      >
        <div className="mission-shell">
          <StatusBar
            loading={loading}
            userName={profile?.name || 'Professional'}
            streak={streak?.currentStreak || 0}
            readiness={readinessScore}
            focus={todayFocus}
          />

          <div className="mission-main-grid">
            <ProgressPanel
              radarData={radarData}
              consistencyData={consistencyData}
              timeline={timelineData}
              loading={loading}
            />
            <ActionCenter tasks={pendingTasks} suggestion={suggestion} loading={loading} />
          </div>

          <InsightStrip
            trendData={trendData}
            weakSkills={analyticsSummary?.weakestSkills || []}
            tickerItems={tickerItems}
            loading={loading}
          />
        </div>
      </Motion.main>
    </div>
  )
}

export default Dashboard
