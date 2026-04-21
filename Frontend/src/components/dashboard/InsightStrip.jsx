import { motion as Motion } from 'framer-motion'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Ticker from './Ticker'

function InsightStrip({ trendData = [], weakSkills = [], tickerItems = [], loading = false }) {
  return (
    <Motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mission-insight-strip"
    >
      <div className="insight-block trend">
        <div className="action-title-row">
          <div className="action-icon emerald">
            <TrendingUp size={15} />
          </div>
          <h4>Performance Trend</h4>
        </div>
        {loading ? (
          <div className="mission-skeleton h-[170px]" />
        ) : trendData.length ? (
          <div className="h-[170px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(245,241,232,0.08)" strokeDasharray="4 4" />
                <XAxis dataKey="label" stroke="rgba(245,241,232,0.65)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(245,241,232,0.65)" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,15,18,0.96)',
                    border: '1px solid rgba(16,185,129,0.45)',
                    borderRadius: '10px',
                    color: '#F5F1E8',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#trendFill)"
                  isAnimationActive
                  animationDuration={1300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mission-empty h-[170px]">No trend data available yet.</div>
        )}
      </div>

      <div className="insight-block weak">
        <div className="action-title-row">
          <div className="action-icon amber">
            <AlertTriangle size={15} />
          </div>
          <h4>Weak Skills Warning</h4>
        </div>
        {loading ? (
          <div className="mission-skeleton h-[120px]" />
        ) : weakSkills.length ? (
          <ul className="weak-list">
            {weakSkills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        ) : (
          <div className="mission-empty h-[120px]">No weak skill signal. Keep consistency high.</div>
        )}
      </div>

      <div className="insight-block ticker">
        <div className="action-title-row">
          <h4>Smart Recommendation Ticker</h4>
        </div>
        <Ticker items={tickerItems} />
      </div>
    </Motion.section>
  )
}

export default InsightStrip
