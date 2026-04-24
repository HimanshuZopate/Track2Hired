import { motion as Motion } from 'framer-motion'
import { Gauge } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ─── Confidence → colour mapping ──────────────────────────────────────────────
function getBarColor(score) {
  if (score >= 5) return '#6ee7b7'
  if (score >= 4) return '#60a5fa'
  if (score >= 3) return '#a78bfa'
  if (score >= 2) return '#fbbf24'
  return '#f87171'
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function SkillTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload ?? {}
  const labels = ['', 'Very Weak', 'Weak', 'Average', 'Good', 'Excellent']

  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-date" style={{ color: '#f5f1e8' }}>
        {d.skillName}
      </p>
      <div className="analytics-tooltip-row">
        <span>Confidence</span>
        <strong style={{ color: getBarColor(d.confidenceScore) }}>
          {d.confidenceScore}/5 — {labels[d.confidenceScore] ?? ''}
        </strong>
      </div>
      <div className="analytics-tooltip-row">
        <span>Category</span>
        <strong>{d.category}</strong>
      </div>
      <div className="analytics-tooltip-row">
        <span>Level</span>
        <strong>{d.level}</strong>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkillSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      {[80, 60, 90, 50, 70].map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="analytics-skeleton"
            style={{ width: 80, height: 12, borderRadius: 6, flexShrink: 0 }}
          />
          <div
            className="analytics-skeleton"
            style={{ width: `${w}%`, height: 16, borderRadius: 4 }}
          />
        </div>
      ))}
    </div>
  )
}

export default function SkillChart({ data, loading }) {
  const skills = data?.all ?? []
  const hasData = skills.length > 0

  // Up to 10 skills, sorted best-first
  const chartData = [...skills]
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 10)

  const chartHeight = Math.max(220, chartData.length * 42)

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="analytics-chart-panel"
    >
      {/* Header */}
      <div className="analytics-panel-header">
        <div className="analytics-panel-title-row">
          <div
            className="analytics-panel-icon"
            style={{ background: 'rgba(139,92,246,0.15)' }}
          >
            <Gauge size={16} style={{ color: '#c4b5fd' }} />
          </div>
          <div>
            <h3 className="analytics-panel-title">Skill Confidence</h3>
            <p className="analytics-panel-subtitle">
              Confidence score per skill (1–5 scale)
            </p>
          </div>
        </div>
        {hasData && (
          <span className="analytics-skill-count">{skills.length} skills</span>
        )}
      </div>

      {/* Legend */}
      {hasData && (
        <div className="analytics-legend-row">
          {[
            { color: '#f87171', label: 'Very Weak (1)' },
            { color: '#fbbf24', label: 'Weak (2)' },
            { color: '#a78bfa', label: 'Average (3)' },
            { color: '#60a5fa', label: 'Good (4)' },
            { color: '#6ee7b7', label: 'Excellent (5)' },
          ].map(({ color, label }) => (
            <div key={label} className="analytics-legend-item">
              <span className="analytics-legend-dot" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <SkillSkeleton />
        ) : !hasData ? (
          <div className="analytics-chart-empty">
            <Gauge size={32} style={{ color: 'rgba(245,241,232,0.3)' }} />
            <p>No skills tracked yet.</p>
            <span>
              Add your technical and HR skills to see confidence scores here.
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 48, left: 8, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                stroke="rgba(255,255,255,0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fill: 'rgba(245,241,232,0.5)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="skillName"
                tick={{ fill: 'rgba(245,241,232,0.75)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={92}
              />
              <Tooltip content={<SkillTooltip />} />
              <Bar
                dataKey="confidenceScore"
                radius={[0, 6, 6, 0]}
                label={{
                  position: 'right',
                  formatter: (v) => `${v}/5`,
                  fill: 'rgba(245,241,232,0.55)',
                  fontSize: 11,
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.confidenceScore)}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Motion.div>
  )
}
