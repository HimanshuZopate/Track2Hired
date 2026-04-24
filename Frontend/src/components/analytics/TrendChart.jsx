import { motion as Motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const score = payload[0]?.value ?? 0
  const delta = payload[1]?.value

  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-date">{label}</p>
      <div className="analytics-tooltip-row">
        <span className="analytics-tooltip-dot" style={{ background: '#60a5fa' }} />
        <span>Readiness Score</span>
        <strong style={{ color: '#60a5fa' }}>{score}%</strong>
      </div>
      {delta !== undefined && delta !== null && (
        <div className="analytics-tooltip-row">
          <span className="analytics-tooltip-dot" style={{ background: delta >= 0 ? '#6ee7b7' : '#fca5a5' }} />
          <span>Change</span>
          <strong style={{ color: delta >= 0 ? '#6ee7b7' : '#fca5a5' }}>
            {delta >= 0 ? '+' : ''}{delta}
          </strong>
        </div>
      )}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyTrend() {
  return (
    <div className="analytics-chart-empty">
      <TrendingUp size={32} style={{ color: 'rgba(245,241,232,0.3)' }} />
      <p>No readiness trend data yet.</p>
      <span>Update your skill confidence scores to see your growth over time.</span>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TrendSkeleton() {
  return (
    <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 8px' }}>
      {[60, 75, 55, 80, 70, 90, 65, 85, 78, 95].map((h, i) => (
        <div
          key={i}
          className="analytics-skeleton"
          style={{ flex: 1, height: `${h}%`, borderRadius: 4 }}
        />
      ))}
    </div>
  )
}

export default function TrendChart({ data = [], loading }) {
  // Format date labels for display
  const chartData = data.map((point) => ({
    ...point,
    label: new Date(point.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
  }))

  const hasData = chartData.length > 0

  // Compute min/max for dynamic Y domain
  const scores = chartData.map((d) => d.score)
  const minScore = hasData ? Math.max(0, Math.min(...scores) - 10) : 0
  const maxScore = hasData ? Math.min(100, Math.max(...scores) + 10) : 100

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="analytics-chart-panel"
    >
      {/* Header */}
      <div className="analytics-panel-header">
        <div className="analytics-panel-title-row">
          <div className="analytics-panel-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <TrendingUp size={16} style={{ color: '#93c5fd' }} />
          </div>
          <div>
            <h3 className="analytics-panel-title">Readiness Trend</h3>
            <p className="analytics-panel-subtitle">Your score growth over the last 30 days</p>
          </div>
        </div>
        {hasData && (
          <div className="analytics-trend-badge">
            {scores[scores.length - 1] >= scores[0] ? '↑ Improving' : '↓ Declining'}
          </div>
        )}
      </div>

      {/* Chart body */}
      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <TrendSkeleton />
        ) : !hasData ? (
          <EmptyTrend />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(245,241,232,0.5)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[minScore, maxScore]}
                tick={{ fill: 'rgba(245,241,232,0.5)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<TrendTooltip />} />
              <ReferenceLine y={60} stroke="rgba(245,158,11,0.35)" strokeDasharray="4 4" label={{ value: 'Target 60%', fill: 'rgba(245,158,11,0.6)', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#60a5fa"
                strokeWidth={2.5}
                dot={{ fill: '#60a5fa', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#93c5fd', strokeWidth: 0 }}
              />
              {/* Ghost delta line */}
              <Line
                type="monotone"
                dataKey="delta"
                stroke="rgba(110,231,183,0.4)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Motion.div>
  )
}
