import { motion as Motion } from 'framer-motion'
import { Activity, CheckSquare, Flame, Target } from 'lucide-react'

const CARDS = [
  {
    key: 'readinessScore',
    label: 'Readiness Score',
    icon: Activity,
    color: 'blue',
    suffix: '%',
    description: 'Overall placement readiness',
    gradient: 'from-blue-500/20 to-blue-600/5',
    glow: 'rgba(59,130,246,0.35)',
    iconBg: 'rgba(59,130,246,0.15)',
    iconColor: '#93c5fd',
    borderColor: 'rgba(59,130,246,0.25)',
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    icon: Target,
    color: 'emerald',
    suffix: '%',
    description: 'Correct answers rate',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    glow: 'rgba(16,185,129,0.3)',
    iconBg: 'rgba(16,185,129,0.15)',
    iconColor: '#6ee7b7',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  {
    key: 'tasksCompleted',
    label: 'Tasks Completed',
    icon: CheckSquare,
    color: 'purple',
    suffix: '',
    description: 'Total tasks finished',
    gradient: 'from-purple-500/20 to-purple-600/5',
    glow: 'rgba(139,92,246,0.3)',
    iconBg: 'rgba(139,92,246,0.15)',
    iconColor: '#c4b5fd',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  {
    key: 'currentStreak',
    label: 'Current Streak',
    icon: Flame,
    color: 'amber',
    suffix: ' days',
    description: 'Consecutive active days',
    gradient: 'from-amber-500/20 to-amber-600/5',
    glow: 'rgba(245,158,11,0.3)',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#fcd34d',
    borderColor: 'rgba(245,158,11,0.25)',
  },
]

function getStatusLabel(key, value) {
  if (key === 'readinessScore') {
    if (value >= 80) return { text: 'Placement Ready', color: '#6ee7b7' }
    if (value >= 60) return { text: 'On Track', color: '#93c5fd' }
    if (value >= 40) return { text: 'Needs Work', color: '#fcd34d' }
    return { text: 'Just Starting', color: '#fca5a5' }
  }
  if (key === 'accuracy') {
    if (value >= 80) return { text: 'Excellent', color: '#6ee7b7' }
    if (value >= 60) return { text: 'Good Progress', color: '#93c5fd' }
    if (value >= 40) return { text: 'Keep Practicing', color: '#fcd34d' }
    return { text: 'Needs Practice', color: '#fca5a5' }
  }
  if (key === 'currentStreak') {
    if (value >= 14) return { text: 'On Fire! 🔥', color: '#fcd34d' }
    if (value >= 7) return { text: 'Great Habit', color: '#6ee7b7' }
    if (value >= 3) return { text: 'Building Up', color: '#93c5fd' }
    return { text: 'Start Today', color: '#fca5a5' }
  }
  return null
}

function AnimatedNumber({ value, suffix }) {
  return (
    <span className="analytics-card-value">
      {value !== undefined && value !== null ? value : '—'}
      {suffix && value !== undefined && value !== null ? (
        <span className="analytics-card-suffix">{suffix}</span>
      ) : null}
    </span>
  )
}

function SummaryCard({ card, value, index, loading }) {
  const Icon = card.icon
  const status = getStatusLabel(card.key, value)

  return (
    <Motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: 'easeOut' }}
      className="analytics-summary-card"
      style={{
        '--card-glow': card.glow,
        '--card-border': card.borderColor,
        '--card-gradient-from': card.gradient.split(' ')[0],
      }}
    >
      {/* Top row */}
      <div className="analytics-card-header">
        <div className="analytics-card-icon" style={{ background: card.iconBg }}>
          <Icon size={18} style={{ color: card.iconColor }} />
        </div>
        {status && (
          <span className="analytics-card-badge" style={{ color: status.color, borderColor: `${status.color}40`, background: `${status.color}12` }}>
            {status.text}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="analytics-card-body">
        {loading ? (
          <div className="analytics-skeleton" style={{ width: '70%', height: '2.2rem', borderRadius: 8 }} />
        ) : (
          <AnimatedNumber value={value} suffix={card.suffix} />
        )}
        <p className="analytics-card-label">{card.label}</p>
        <p className="analytics-card-desc">{card.description}</p>
      </div>

      {/* Bottom accent line */}
      <div className="analytics-card-accent" style={{ background: `linear-gradient(90deg, ${card.iconColor}80, transparent)` }} />
    </Motion.div>
  )
}

export default function SummaryCards({ data, loading }) {
  return (
    <div className="analytics-summary-grid">
      {CARDS.map((card, i) => (
        <SummaryCard
          key={card.key}
          card={card}
          value={data?.[card.key]}
          index={i}
          loading={loading}
        />
      ))}
    </div>
  )
}
