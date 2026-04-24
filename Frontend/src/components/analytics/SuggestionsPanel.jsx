import { motion as Motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckSquare,
  Flame,
  Lightbulb,
  PlusCircle,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS = {
  AlertTriangle,
  Flame,
  Target,
  CheckSquare,
  Sparkles,
  PlusCircle,
  TrendingUp,
  Lightbulb,
}

// ─── Priority → styling ────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  high: {
    border: 'rgba(239,68,68,0.3)',
    bg: 'rgba(239,68,68,0.07)',
    iconBg: 'rgba(239,68,68,0.15)',
    iconColor: '#fca5a5',
    badge: '#fca5a5',
    badgeBg: 'rgba(239,68,68,0.12)',
    label: 'High Priority',
  },
  medium: {
    border: 'rgba(245,158,11,0.3)',
    bg: 'rgba(245,158,11,0.06)',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#fcd34d',
    badge: '#fcd34d',
    badgeBg: 'rgba(245,158,11,0.12)',
    label: 'Improve',
  },
  low: {
    border: 'rgba(16,185,129,0.3)',
    bg: 'rgba(16,185,129,0.06)',
    iconBg: 'rgba(16,185,129,0.15)',
    iconColor: '#6ee7b7',
    badge: '#6ee7b7',
    badgeBg: 'rgba(16,185,129,0.12)',
    label: 'Great Work',
  },
}

// ─── Single Suggestion Card ────────────────────────────────────────────────────
function SuggestionItem({ suggestion, index }) {
  const Icon = ICONS[suggestion.icon] ?? Lightbulb
  const style = PRIORITY_STYLES[suggestion.priority] ?? PRIORITY_STYLES.medium

  return (
    <Motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
      className="analytics-suggestion-card"
      style={{
        borderColor: style.border,
        background: style.bg,
      }}
    >
      {/* Icon */}
      <div className="analytics-suggestion-icon" style={{ background: style.iconBg }}>
        <Icon size={15} style={{ color: style.iconColor }} />
      </div>

      {/* Content */}
      <div className="analytics-suggestion-body">
        <div className="analytics-suggestion-top">
          <span
            className="analytics-suggestion-badge"
            style={{ color: style.badge, background: style.badgeBg, borderColor: `${style.badge}40` }}
          >
            {style.label}
          </span>
        </div>
        <p className="analytics-suggestion-message">{suggestion.message}</p>
        {suggestion.action && suggestion.route && (
          <Link to={suggestion.route} className="analytics-suggestion-cta">
            {suggestion.action} →
          </Link>
        )}
      </div>
    </Motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SuggestionSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="analytics-skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="analytics-skeleton" style={{ width: '30%', height: 12, borderRadius: 6 }} />
            <div className="analytics-skeleton" style={{ width: '90%', height: 14, borderRadius: 6 }} />
            <div className="analytics-skeleton" style={{ width: '60%', height: 14, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SuggestionsPanel({ suggestions = [], loading }) {
  const hasData = suggestions.length > 0

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="analytics-chart-panel"
    >
      {/* Header */}
      <div className="analytics-panel-header">
        <div className="analytics-panel-title-row">
          <div className="analytics-panel-icon" style={{ background: 'rgba(168,85,247,0.15)' }}>
            <Lightbulb size={16} style={{ color: '#d8b4fe' }} />
          </div>
          <div>
            <h3 className="analytics-panel-title">Smart Suggestions</h3>
            <p className="analytics-panel-subtitle">AI-driven recommendations for you</p>
          </div>
        </div>
        {hasData && (
          <span className="analytics-skill-count">{suggestions.length} tips</span>
        )}
      </div>

      {/* Body */}
      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <SuggestionSkeleton />
        ) : !hasData ? (
          <div className="analytics-chart-empty">
            <Sparkles size={28} style={{ color: 'rgba(245,241,232,0.3)' }} />
            <p>No suggestions yet.</p>
            <span>Complete tasks, practice questions, and add skills to receive personalized tips.</span>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {suggestions.map((s, i) => (
                <SuggestionItem key={`${s.type}-${i}`} suggestion={s} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </Motion.div>
  )
}
