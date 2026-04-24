import { motion as Motion } from 'framer-motion'
import { Target } from 'lucide-react'
import {
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function AccuracyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-row">
        <span
          className="analytics-tooltip-dot"
          style={{ background: name === 'Correct' ? '#6ee7b7' : '#f87171' }}
        />
        <span>{name}</span>
        <strong style={{ color: name === 'Correct' ? '#6ee7b7' : '#f87171' }}>
          {value}
        </strong>
      </div>
    </div>
  )
}

// ─── Custom Centre Label (rendered inside recharts Label) ──────────────────────
function CentreLabel({ viewBox, accuracy }) {
  if (!viewBox) return null
  const { cx, cy } = viewBox
  return (
    <g>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#f5f1e8"
        fontSize={28}
        fontWeight={700}
      >
        {accuracy}%
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(245,241,232,0.5)"
        fontSize={11}
      >
        Accuracy
      </text>
    </g>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function AccuracySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 16 }}>
      <div
        className="analytics-skeleton"
        style={{ width: 180, height: 180, borderRadius: '50%' }}
      />
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="analytics-skeleton" style={{ width: 80, height: 14, borderRadius: 6 }} />
        <div className="analytics-skeleton" style={{ width: 80, height: 14, borderRadius: 6 }} />
      </div>
    </div>
  )
}

// ─── Difficulty breakdown rows ─────────────────────────────────────────────────
function DifficultyRow({ item }) {
  const pct = item.accuracy ?? 0
  const color =
    pct >= 80 ? '#6ee7b7' : pct >= 60 ? '#60a5fa' : pct >= 40 ? '#fbbf24' : '#f87171'
  return (
    <div className="analytics-diff-row">
      <span className="analytics-diff-label">{item.difficulty}</span>
      <div className="analytics-diff-bar-wrap">
        <Motion.div
          className="analytics-diff-bar"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
      <span className="analytics-diff-pct" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function AccuracyChart({ data, loading }) {
  const totalAttempts    = data?.totalAttempts    ?? 0
  const correctAnswers   = data?.correctAnswers   ?? 0
  const incorrectAnswers = data?.incorrectAnswers ?? 0
  const accuracy         = data?.accuracy         ?? 0
  const difficultyBreakdown = data?.difficultyBreakdown ?? []

  const hasData = totalAttempts > 0

  const pieData = [
    { name: 'Correct',   value: correctAnswers,  fill: '#6ee7b7' },
    { name: 'Incorrect', value: incorrectAnswers, fill: '#f87171' },
  ]

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="analytics-chart-panel"
    >
      {/* Header */}
      <div className="analytics-panel-header">
        <div className="analytics-panel-title-row">
          <div className="analytics-panel-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <Target size={16} style={{ color: '#6ee7b7' }} />
          </div>
          <div>
            <h3 className="analytics-panel-title">Answer Accuracy</h3>
            <p className="analytics-panel-subtitle">Correct vs incorrect attempts</p>
          </div>
        </div>
        {hasData && (
          <span className="analytics-skill-count">{totalAttempts} attempts</span>
        )}
      </div>

      {loading ? (
        <AccuracySkeleton />
      ) : !hasData ? (
        <div className="analytics-chart-empty">
          <Target size={32} style={{ color: 'rgba(245,241,232,0.3)' }} />
          <p>No attempts recorded yet.</p>
          <span>Practice interview questions to track your accuracy.</span>
        </div>
      ) : (
        <>
          {/* Donut chart with centre label */}
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.88} stroke="none" />
                ))}
                <Label
                  content={(props) => <CentreLabel viewBox={props.viewBox} accuracy={accuracy} />}
                  position="center"
                />
              </Pie>
              <Tooltip content={<AccuracyTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: 'rgba(245,241,232,0.75)', fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Breakdown by difficulty */}
          {difficultyBreakdown.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <p className="analytics-panel-subtitle" style={{ marginBottom: '0.6rem' }}>
                By Difficulty
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {difficultyBreakdown.map((item) => (
                  <DifficultyRow key={item.difficulty} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Motion.div>
  )
}
