import { motion as Motion } from 'framer-motion'
import { AlertTriangle, BarChart3, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { dashboardApi } from '../services/api'
import Sidebar from '../components/Sidebar'
import SummaryCards from '../components/analytics/SummaryCards'
import TrendChart from '../components/analytics/TrendChart'
import SkillChart from '../components/analytics/SkillChart'
import AccuracyChart from '../components/analytics/AccuracyChart'
import SuggestionsPanel from '../components/analytics/SuggestionsPanel'

// ─── Smart Message Ticker ──────────────────────────────────────────────────────
function SmartMessages({ summary, skills, suggestions }) {
  const messages = []

  if (skills?.strongSkills?.length > 0) {
    messages.push(`🏆 Your strongest skill is ${skills.strongSkills[0]}`)
  }
  if (skills?.weakSkills?.length > 0) {
    messages.push(`⚠️ You need improvement in ${skills.weakSkills[0]}`)
  }
  if (summary?.currentStreak >= 7) {
    messages.push(`🔥 ${summary.currentStreak}-day streak — keep it going!`)
  } else if (summary?.currentStreak === 0) {
    messages.push(`💡 Start your streak today — consistency is the #1 placement skill`)
  }
  if (summary?.accuracy >= 80) {
    messages.push(`✅ Excellent accuracy: ${summary.accuracy}% — placement ready!`)
  } else if (summary?.accuracy > 0) {
    messages.push(`📈 Your accuracy is ${summary.accuracy}% — target 80%+ for interviews`)
  }
  if (summary?.readinessScore >= 75) {
    messages.push(`🎯 Readiness Score: ${summary.readinessScore}% — you're interview-ready!`)
  }
  if (summary?.tasksCompleted > 0) {
    messages.push(`✔️ ${summary.tasksCompleted} tasks completed — great discipline!`)
  }
  if (suggestions?.length > 0 && suggestions[0]?.type !== 'praise') {
    messages.push(`💬 Tip: ${suggestions[0].message.slice(0, 80)}...`)
  }

  // Duplicate for infinite scroll
  const doubled = [...messages, ...messages]

  if (messages.length === 0) return null

  return (
    <div className="analytics-ticker-wrap">
      <div className="analytics-ticker-track">
        {doubled.map((msg, i) => (
          <span key={i} className="analytics-ticker-item">
            {msg}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Weak / Strong Skills Pills ────────────────────────────────────────────────
function SkillPills({ title, skills, color, icon: Icon, emptyText }) {
  return (
    <div className="analytics-skill-pills-block">
      <div className="analytics-skill-pills-header">
        <Icon size={14} style={{ color }} />
        <span style={{ color }}>{title}</span>
      </div>
      {skills?.length > 0 ? (
        <div className="analytics-pills-row">
          {skills.map((s) => (
            <span key={s} className="analytics-pill" style={{ borderColor: `${color}40`, background: `${color}12`, color }}>
              {s}
            </span>
          ))}
        </div>
      ) : (
        <p className="analytics-pills-empty">{emptyText}</p>
      )}
    </div>
  )
}

// ─── Insights Section ──────────────────────────────────────────────────────────
function InsightsSection({ skills, loading }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="analytics-insights-panel"
    >
      <div className="analytics-panel-header">
        <div className="analytics-panel-title-row">
          <div className="analytics-panel-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Zap size={16} style={{ color: '#fcd34d' }} />
          </div>
          <div>
            <h3 className="analytics-panel-title">Skill Insights</h3>
            <p className="analytics-panel-subtitle">Strengths & areas to improve</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="analytics-skeleton" style={{ width: '40%', height: 12, borderRadius: 6 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map((j) => (
                  <div key={j} className="analytics-skeleton" style={{ width: 70, height: 24, borderRadius: 20 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SkillPills
            title="Strong Skills"
            skills={skills?.strongSkills}
            color="#6ee7b7"
            icon={Sparkles}
            emptyText="No strong skills (confidence > 4) yet. Keep building!"
          />
          <SkillPills
            title="Weak Skills — Need Attention"
            skills={skills?.weakSkills}
            color="#fca5a5"
            icon={AlertTriangle}
            emptyText="No weak skills detected. Great work!"
          />
          {skills?.averageConfidence !== undefined && (
            <div className="analytics-avg-confidence">
              <span className="analytics-panel-subtitle">Average Confidence</span>
              <span className="analytics-avg-value">{skills.averageConfidence}<span className="analytics-card-suffix">/5</span></span>
            </div>
          )}
        </div>
      )}
    </Motion.div>
  )
}

// ─── Error Banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="analytics-error-banner">
      <AlertTriangle size={16} />
      <span>{message}</span>
      <button onClick={onRetry} className="analytics-retry-btn">Retry</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Analytics() {
  const [summary, setSummary]           = useState(null)
  const [skills, setSkills]             = useState(null)
  const [trend, setTrend]               = useState([])
  const [performance, setPerformance]   = useState(null)
  const [suggestions, setSuggestions]   = useState([])

  const [loadingSummary, setLoadingSummary]         = useState(true)
  const [loadingSkills, setLoadingSkills]           = useState(true)
  const [loadingTrend, setLoadingTrend]             = useState(true)
  const [loadingPerformance, setLoadingPerformance] = useState(true)
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)

  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setError(null)

    // Fetch all in parallel — each updates independently
    const safeSet = (setter, setLoading) => async (promise) => {
      try {
        const res = await promise
        setter(res.data?.data ?? res.data)
      } catch {
        // Individual failures are non-fatal
      } finally {
        setLoading(false)
      }
    }

    try {
      await Promise.all([
        safeSet(setSummary, setLoadingSummary)(dashboardApi.getAnalyticsSummary()),
        safeSet(setSkills, setLoadingSkills)(dashboardApi.getAnalyticsSkills()),
        safeSet(setTrend, setLoadingTrend)(dashboardApi.getReadinessTrend(30)),
        safeSet(setPerformance, setLoadingPerformance)(dashboardApi.getAnalyticsPerformance()),
        safeSet(setSuggestions, setLoadingSuggestions)(dashboardApi.getAnalyticsSuggestions()),
      ])
    } catch {
      setError('Failed to load analytics. Please try again.')
      setLoadingSummary(false)
      setLoadingSkills(false)
      setLoadingTrend(false)
      setLoadingPerformance(false)
      setLoadingSuggestions(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const globalLoading =
    loadingSummary || loadingSkills || loadingTrend || loadingPerformance || loadingSuggestions

  return (
    <div className="analytics-layout">
      <Sidebar />

      <main className="analytics-main">
        {/* Ambient orbs */}
        <div className="analytics-orb analytics-orb-blue" />
        <div className="analytics-orb analytics-orb-purple" />
        <div className="analytics-orb analytics-orb-teal" />

        <div className="analytics-shell">

          {/* ── Page Header ─────────────────────────────────────────── */}
          <Motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="analytics-page-header"
          >
            <div>
              <div className="analytics-page-eyebrow">
                <BarChart3 size={14} />
                Decision Intelligence
              </div>
              <h1 className="analytics-page-title">Analytics Dashboard</h1>
              <p className="analytics-page-subtitle">
                Real-time insights into your placement readiness
              </p>
            </div>
            <Motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={fetchAll}
              disabled={globalLoading}
              className="analytics-refresh-btn"
            >
              <TrendingUp size={14} />
              {globalLoading ? 'Refreshing…' : 'Refresh'}
            </Motion.button>
          </Motion.div>

          {/* ── Error Banner ─────────────────────────────────────────── */}
          {error && <ErrorBanner message={error} onRetry={fetchAll} />}

          {/* ── Smart Message Ticker ──────────────────────────────────── */}
          {!globalLoading && (
            <SmartMessages
              summary={summary}
              skills={skills}
              suggestions={suggestions}
            />
          )}

          {/* ── SECTION 1 — Summary Cards ─────────────────────────────── */}
          <SummaryCards data={summary} loading={loadingSummary} />

          {/* ── SECTION 2 — Charts Row ────────────────────────────────── */}
          <div className="analytics-charts-grid">
            <TrendChart data={trend} loading={loadingTrend} />
            <AccuracyChart data={performance} loading={loadingPerformance} />
          </div>

          {/* ── SECTION 3 — Skill Chart + Suggestions + Insights ──────── */}
          <div className="analytics-bottom-grid">
            <SkillChart data={skills} loading={loadingSkills} />
            <div className="analytics-right-col">
              <InsightsSection skills={skills} loading={loadingSkills} />
              <SuggestionsPanel suggestions={suggestions} loading={loadingSuggestions} />
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
