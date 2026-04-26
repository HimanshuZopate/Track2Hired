import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function ConsistencyGraph({ data = [], loading = false }) {
  if (loading) {
    return <div className="mission-skeleton h-[220px]" />
  }

  if (!data.length) {
    return <div className="mission-empty h-[220px]">No weekly consistency points yet.</div>
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="consistencyStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(245,241,232,0.09)" strokeDasharray="4 4" />
          <XAxis dataKey="label" stroke="rgba(245,241,232,0.68)" tick={{ fontSize: 12 }} />
          <YAxis stroke="rgba(245,241,232,0.68)" tick={{ fontSize: 12 }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: 'rgba(15,15,18,0.96)',
              border: '1px solid rgba(59,130,246,0.45)',
              borderRadius: '10px',
              color: '#F5F1E8',
            }}
          />
          <Line
            name="Activity Score"
            type="monotone"
            dataKey="score"
            stroke="url(#consistencyStroke)"
            strokeWidth={3}
            dot={{ r: 3, fill: '#10b981' }}
            activeDot={{ r: 5, fill: '#f59e0b' }}
            isAnimationActive
            animationDuration={1200}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ConsistencyGraph
