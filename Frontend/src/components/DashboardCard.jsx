import { motion as Motion } from 'framer-motion'

function DashboardCard({ children, className = '', glow = 'blue' }) {
  const glowStyles = {
    blue: 'hover:shadow-neonBlue',
    purple: 'hover:shadow-neonPurple',
    emerald: 'hover:shadow-neonEmerald',
    amber: 'hover:shadow-neonAmber',
  }

  return (
    <Motion.section
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={`glass-card rounded-2xl p-5 shadow-glass transition-all duration-300 ${glowStyles[glow] || glowStyles.blue} ${className}`}
    >
      {children}
    </Motion.section>
  )
}

export default DashboardCard
