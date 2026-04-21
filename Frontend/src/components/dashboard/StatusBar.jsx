import { motion as Motion } from 'framer-motion'
import { CalendarDays, Flame, Target } from 'lucide-react'
import AnimatedCounter from '../AnimatedCounter'

function ReadinessRing({ value = 0 }) {
  const size = 90
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const normalized = Math.max(0, Math.min(100, Number(value) || 0))
  const offset = circumference - (normalized / 100) * circumference

  return (
    <div className="status-ring-wrap">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="transparent"
          stroke="rgba(245,241,232,0.15)"
        />
        <Motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          stroke="url(#statusRingGradient)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="statusRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <p className="status-ring-label">
        <AnimatedCounter value={normalized} suffix="%" />
      </p>
    </div>
  )
}

function StatusBar({ loading = false, userName = 'Candidate', streak = 0, readiness = 0, focus = "Today's Focus" }) {
  return (
    <Motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mission-status-bar"
    >
      <div className="status-zone">
        <p className="status-kicker">Mission Control</p>
        <h1>Welcome back, {loading ? '...' : userName}</h1>
      </div>

      <div className="status-separator" />

      <div className="status-zone compact">
        <div className="status-icon-badge flame">
          <Motion.div
            animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            <Flame size={16} />
          </Motion.div>
        </div>
        <div>
          <p className="status-label">Current Streak</p>
          <p className="status-value">
            <AnimatedCounter value={loading ? 0 : streak} /> days
          </p>
        </div>
      </div>

      <div className="status-separator" />

      <div className="status-zone compact readiness">
        <div>
          <p className="status-label">Readiness Score</p>
          <p className="status-sub">Live confidence index</p>
        </div>
        <ReadinessRing value={loading ? 0 : readiness} />
      </div>

      <div className="status-separator" />

      <div className="status-zone compact">
        <div className="status-icon-badge focus">
          <Target size={15} />
        </div>
        <div>
          <p className="status-label flex items-center gap-1">
            <CalendarDays size={13} /> Today&apos;s Focus
          </p>
          <p className="focus-chip">{focus}</p>
        </div>
      </div>
    </Motion.section>
  )
}

export default StatusBar
