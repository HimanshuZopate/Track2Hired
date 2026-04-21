import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

function RadarChart({ data = [], loading = false }) {
  if (loading) {
    return <div className="mission-skeleton h-[240px]" />
  }

  if (!data.length) {
    return <div className="mission-empty h-[240px]">No skill confidence data yet.</div>
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(245,241,232,0.2)" />
          <PolarAngleAxis dataKey="subject" stroke="rgba(245,241,232,0.8)" tick={{ fontSize: 12 }} />
          <Radar
            dataKey="score"
            stroke="#8b5cf6"
            fill="#3b82f6"
            fillOpacity={0.28}
            strokeWidth={2}
            isAnimationActive
            animationDuration={1100}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15,15,18,0.94)',
              border: '1px solid rgba(139,92,246,0.5)',
              borderRadius: '10px',
              color: '#F5F1E8',
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RadarChart
