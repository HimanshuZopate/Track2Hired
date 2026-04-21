import { motion as Motion } from 'framer-motion'

const levelColors = {
  1: { bar: 'from-red-500 to-red-400', glow: 'rgba(239,68,68,0.5)', label: '#f87171' },
  2: { bar: 'from-orange-500 to-amber-400', glow: 'rgba(245,158,11,0.5)', label: '#fbbf24' },
  3: { bar: 'from-yellow-400 to-yellow-300', glow: 'rgba(234,179,8,0.5)', label: '#facc15' },
  4: { bar: 'from-blue-500 to-cyan-400', glow: 'rgba(59,130,246,0.5)', label: '#60a5fa' },
  5: { bar: 'from-emerald-500 to-green-400', glow: 'rgba(16,185,129,0.5)', label: '#34d399' },
}

const labels = { 1: 'Very Low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Expert' }

function ConfidenceBar({ score = 1, animate = true }) {
  const clamped = Math.min(Math.max(Math.round(score), 1), 5)
  const percent = (clamped / 5) * 100
  const theme = levelColors[clamped]

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">
          Confidence
        </span>
        <span className="text-[11px] font-semibold" style={{ color: theme.label }}>
          {clamped}/5 · {labels[clamped]}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
        <Motion.div
          className={`h-full rounded-full bg-gradient-to-r ${theme.bar}`}
          style={{ boxShadow: `0 0 10px ${theme.glow}` }}
          initial={animate ? { width: 0 } : { width: `${percent}%` }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
        />
      </div>

      {/* Pip dots */}
      <div className="mt-1.5 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((pip) => (
          <div
            key={pip}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: pip <= clamped ? theme.label : 'rgba(255,255,255,0.12)',
              boxShadow: pip <= clamped ? `0 0 5px ${theme.glow}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default ConfidenceBar
