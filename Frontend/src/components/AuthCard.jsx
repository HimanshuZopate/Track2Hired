import { motion as Motion } from 'framer-motion'

function AuthCard({ title, subtitle, children, footer }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="auth-glass-card w-full max-w-[500px] rounded-2xl border border-white/15 p-5 shadow-glass sm:p-8"
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black tracking-[0.16em] text-almond sm:text-3xl">
          TRACK
          <span className="mx-[2px] text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.95)]">2</span>
          HIRED
        </h1>
        <h2 className="mt-4 text-2xl font-bold text-almond">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-white/70">{subtitle}</p> : null}
      </div>

      {children}

      {footer ? <div className="mt-6 text-center text-sm text-white/75">{footer}</div> : null}
    </Motion.div>
  )
}

export default AuthCard
