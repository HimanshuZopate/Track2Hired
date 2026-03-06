import { motion as Motion } from 'framer-motion'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function SkillChart({ data = [], loading = false }) {
  if (loading) {
    return <div className="h-72 w-full animate-pulse rounded-xl bg-white/5" />
  }

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-white/10 text-sm text-white/60">
        No skill confidence data available yet.
      </div>
    )
  }

  return (
    <div className="h-72 min-w-[620px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 24, left: 0, bottom: 12 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.45)"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: active ? 1 : 0 }}
                className="rounded-lg border border-white/20 bg-[#12131a]/95 px-3 py-2 text-xs text-almond"
              >
                <p className="mb-1 text-white/70">{label}</p>
                {payload?.map((entry) => (
                  <p key={entry.name} style={{ color: entry.color }}>{`${entry.name}: ${entry.value}%`}</p>
                ))}
              </Motion.div>
            )}
          />
          <Line
            type="monotone"
            dataKey="technical"
            stroke="#60A5FA"
            strokeWidth={2.8}
            dot={{ r: 2 }}
            name="Technical"
            isAnimationActive
            animationDuration={900}
          />
          <Line
            type="monotone"
            dataKey="problemSolving"
            stroke="#C084FC"
            strokeWidth={2.8}
            dot={{ r: 2 }}
            name="Problem Solving"
            isAnimationActive
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="communication"
            stroke="#6EE7B7"
            strokeWidth={2.8}
            dot={{ r: 2 }}
            name="Communication"
            isAnimationActive
            animationDuration={1100}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SkillChart
