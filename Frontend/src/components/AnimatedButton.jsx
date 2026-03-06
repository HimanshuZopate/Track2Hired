import { motion as Motion } from 'framer-motion'
import { LoaderCircle } from 'lucide-react'

function AnimatedButton({ children, loading, disabled, type = 'button' }) {
  return (
    <Motion.button
      type={type}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.99 }}
      className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative z-10 inline-flex items-center gap-2">
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {children}
      </span>
    </Motion.button>
  )
}

export default AnimatedButton
