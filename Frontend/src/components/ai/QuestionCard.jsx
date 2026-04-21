import { AnimatePresence, motion as Motion } from 'framer-motion'
import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Code2, Hash, MessageSquare, Pencil } from 'lucide-react'

const TYPE_META = {
  MCQ:    { icon: Hash,          color: 'text-blue-300',   bg: 'bg-blue-500/10',    border: 'border-blue-400/25'    },
  Theory: { icon: BookOpen,      color: 'text-purple-300', bg: 'bg-purple-500/10',  border: 'border-purple-400/25'  },
  Coding: { icon: Code2,         color: 'text-cyan-300',   bg: 'bg-cyan-500/10',    border: 'border-cyan-400/25'    },
  Mixed:  { icon: MessageSquare, color: 'text-amber-300',  bg: 'bg-amber-500/10',   border: 'border-amber-400/25'   },
}

const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1    },
  exit:    { opacity: 0, y: -10, scale: 0.95 },
}

function QuestionCard({ question, index, isActive, onSelect, attempt }) {
  const meta  = TYPE_META[question.type] || TYPE_META.Theory
  const Icon  = meta.icon
  const done  = Boolean(attempt)

  return (
    <Motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-2xl border transition-all"
      style={{
        borderColor: isActive
          ? 'rgba(139,92,246,0.5)'
          : done
          ? 'rgba(16,185,129,0.25)'
          : 'rgba(255,255,255,0.08)',
        background: isActive
          ? 'linear-gradient(145deg, rgba(139,92,246,0.1), rgba(59,130,246,0.06))'
          : done
          ? 'rgba(16,185,129,0.04)'
          : 'rgba(255,255,255,0.03)',
        boxShadow: isActive
          ? '0 0 0 1px rgba(139,92,246,0.3), 0 0 30px rgba(139,92,246,0.12)'
          : 'none',
      }}
    >
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={() => onSelect(isActive ? null : question.id)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left"
      >
        {/* Index number */}
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
          style={{
            background: isActive ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.07)',
            color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
            border: isActive ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {index + 1}
        </div>

        {/* Question text */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${isActive ? 'text-almond' : 'text-white/75'}`}>
            {question.question}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Type badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.border} ${meta.color}`}
            >
              <Icon size={9} />
              {question.type}
            </span>

            {/* MCQ options preview */}
            {question.type === 'MCQ' && question.options?.length > 0 && (
              <span className="text-[10px] text-white/30">
                {question.options.length} options
              </span>
            )}

            {/* Attempted badge */}
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-400/20">
                <CheckCircle2 size={9} />
                Attempted · {attempt.attemptCount}×
              </span>
            )}
          </div>
        </div>

        {/* Chevron + action */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-white/30">
            {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {!isActive && (
            <div
              className="flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium text-purple-300"
              style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)' }}
            >
              <Pencil size={9} />
              Answer
            </div>
          )}
        </div>
      </button>

      {/* Expanded: MCQ options (read-only display) */}
      <AnimatePresence>
        {isActive && question.type === 'MCQ' && question.options?.length > 0 && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/30">
                Options
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {question.options.map((opt, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-white/65"
                  >
                    <span className="mr-1.5 font-semibold text-blue-400/70">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  )
}

export default QuestionCard
