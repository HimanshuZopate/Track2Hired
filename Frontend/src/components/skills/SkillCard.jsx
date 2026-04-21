import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ConfidenceBar from './ConfidenceBar'

const CATEGORY_STYLES = {
  Technical: {
    bg: 'bg-blue-500/15',
    border: 'border-blue-400/30',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
  },
  HR: {
    bg: 'bg-purple-500/15',
    border: 'border-purple-400/30',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
  },
  Behavioral: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-400/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
}

const LEVEL_STYLES = {
  Beginner: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-400/25' },
  Intermediate: { text: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-400/25' },
  Advanced: { text: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-400/25' },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.93, y: 12 },
}

function SkillCard({ skill, index = 0, onEdit, onDelete, deleting = false }) {
  const [hovering, setHovering] = useState(false)
  const cat = CATEGORY_STYLES[skill.category] || CATEGORY_STYLES.Technical
  const lvl = LEVEL_STYLES[skill.level] || LEVEL_STYLES.Beginner

  return (
    <Motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -3, boxShadow: '0 0 0 1px rgba(59,130,246,0.3), 0 8px 32px rgba(59,130,246,0.12), 0 0 40px rgba(139,92,246,0.1)' }}
      transition={{ duration: 0.35, delay: index * 0.055, ease: [0.23, 1, 0.32, 1] }}
      onHoverStart={() => setHovering(true)}
      onHoverEnd={() => setHovering(false)}
      style={{
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)',
      }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-[#18181c]/70 p-5 backdrop-blur-md"
    >
      {/* Ambient glow on hover */}
      <AnimatePresence>
        {hovering && (
          <Motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background:
                'radial-gradient(ellipse at top left, rgba(59,130,246,0.07), transparent 60%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-base font-semibold text-almond leading-tight">
            {skill.skillName}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Category badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cat.bg} ${cat.border} ${cat.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
              {skill.category}
            </span>
            {/* Level chip */}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${lvl.bg} ${lvl.border} ${lvl.text}`}
            >
              {skill.level}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          <Motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => onEdit(skill)}
            title="Edit skill"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-400/20 transition-colors hover:bg-blue-500/20 hover:shadow-neonBlue"
          >
            <Pencil size={13} />
          </Motion.button>
          <Motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => onDelete(skill._id)}
            disabled={deleting}
            title="Delete skill"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-400/20 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            {deleting ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-red-400 border-t-transparent" />
            ) : (
              <Trash2 size={13} />
            )}
          </Motion.button>
        </div>
      </div>

      {/* Confidence bar */}
      <ConfidenceBar score={skill.confidenceScore} />
    </Motion.div>
  )
}

export default SkillCard
