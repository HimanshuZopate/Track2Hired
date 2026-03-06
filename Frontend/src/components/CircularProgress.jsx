import { motion as Motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

function CircularProgress({ value = 0, label = '', subtitle = '', size = 180 }) {
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const normalized = Math.max(0, Math.min(100, Number(value) || 0))
  const offset = circumference - (normalized / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <Motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          stroke="url(#ringGradient)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#84CC16" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-bold text-almond">
          <AnimatedCounter value={normalized} suffix="%" duration={1} />
        </p>
        {label ? <p className="mt-1 text-sm text-white/75">{label}</p> : null}
        {subtitle ? <p className="text-xs text-white/55">{subtitle}</p> : null}
      </div>
    </div>
  )
}

export default CircularProgress
