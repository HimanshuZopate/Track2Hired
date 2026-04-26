import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Hash,
  MessageSquare,
  XCircle,
} from 'lucide-react'

const TYPE_META = {
  MCQ:    { icon: Hash,          color: 'text-blue-300',   bg: 'bg-blue-500/10',    border: 'border-blue-400/25'    },
  Theory: { icon: BookOpen,      color: 'text-purple-300', bg: 'bg-purple-500/10',  border: 'border-purple-400/25'  },
  Coding: { icon: Code2,         color: 'text-cyan-300',   bg: 'bg-cyan-500/10',    border: 'border-cyan-400/25'    },
  Mixed:  { icon: MessageSquare, color: 'text-amber-300',  bg: 'bg-amber-500/10',   border: 'border-amber-400/25'   },
}

// ─── MCQ Card (inline radio buttons + result state) ───────────────────────────
export function McqCard({ question, index, selectedAnswer, onSelect, result }) {
  const answered  = result !== undefined
  const isCorrect = answered && result.correct
  const isWrong   = answered && !result.correct

  const borderColor = !answered
    ? 'rgba(255,255,255,0.08)'
    : isCorrect ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'

  const background = !answered
    ? 'rgba(255,255,255,0.02)'
    : isCorrect
      ? 'linear-gradient(145deg,rgba(16,185,129,0.07),rgba(14,15,22,0.9))'
      : 'linear-gradient(145deg,rgba(239,68,68,0.07),rgba(14,15,22,0.9))'

  return (
    <Motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.045, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor, background, boxShadow: answered && isCorrect ? '0 0 0 1px rgba(16,185,129,0.15)' : answered && isWrong ? '0 0 0 1px rgba(239,68,68,0.12)' : 'none' }}
    >
      {/* Question header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
          style={{
            background: answered ? (isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.07)',
            color: answered ? (isCorrect ? '#34d399' : '#f87171') : 'rgba(255,255,255,0.45)',
            border: `1px solid ${answered ? (isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          {answered
            ? (isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />)
            : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug text-almond">{question.question}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border bg-blue-500/10 border-blue-400/25 px-2 py-0.5 text-[10px] font-medium text-blue-300">
              <Hash size={9} />
              MCQ
            </span>
            {answered && (
              <span className={`text-[10px] font-semibold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Radio options */}
      <div className="space-y-1.5 px-4 pb-4">
        {question.options.map((opt, i) => {
          const isSelected   = selectedAnswer === opt
          const isThisCorrect = answered && opt === result.correctAnswer
          const isThisWrong   = answered && isSelected && !result.correct

          let optBg     = isSelected && !answered ? 'rgba(139,92,246,0.1)'  : 'rgba(255,255,255,0.02)'
          let optBorder = isSelected && !answered ? 'rgba(139,92,246,0.45)' : 'rgba(255,255,255,0.07)'
          let optColor  = isSelected && !answered ? '#c4b5fd'               : 'rgba(255,255,255,0.6)'

          if (answered) {
            if (isThisCorrect) {
              optBg = 'rgba(16,185,129,0.12)'; optBorder = 'rgba(16,185,129,0.45)'; optColor = '#6ee7b7'
            } else if (isThisWrong) {
              optBg = 'rgba(239,68,68,0.1)'; optBorder = 'rgba(239,68,68,0.4)'; optColor = '#fca5a5'
            } else {
              optColor = 'rgba(255,255,255,0.35)'
            }
          }

          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => !answered && onSelect(question.id, opt)}
              className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all disabled:cursor-default"
              style={{ background: optBg, borderColor: optBorder }}
            >
              {/* Radio circle / result icon */}
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                style={{ borderColor: optBorder }}
              >
                {answered
                  ? isThisCorrect
                    ? <CheckCircle2 size={11} style={{ color: '#34d399' }} />
                    : isThisWrong
                    ? <XCircle size={11} style={{ color: '#f87171' }} />
                    : null
                  : isSelected
                  ? <span className="h-2 w-2 rounded-full bg-purple-400" />
                  : null
                }
              </span>

              {/* Option label */}
              <span className="font-medium transition-colors" style={{ color: optColor }}>
                <span className="mr-2 text-[11px] font-bold opacity-60">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </span>
            </button>
          )
        })}
      </div>

      {/* Explanation revealed after answer */}
      <AnimatePresence>
        {answered && result.explanation && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">
                Explanation
              </p>
              <p className="text-xs leading-relaxed text-white/60">{result.explanation}</p>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  )
}

// ─── Theory Card (click-to-select, existing behavior) ─────────────────────────
function TheoryCard({ question, index, isActive, onSelect, attempt }) {
  const meta = TYPE_META[question.type] || TYPE_META.Theory
  const Icon = meta.icon
  const done = Boolean(attempt)

  return (
    <Motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.045, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-2xl border transition-all"
      style={{
        borderColor: isActive ? 'rgba(139,92,246,0.5)' : done ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)',
        background:  isActive ? 'linear-gradient(145deg,rgba(139,92,246,0.1),rgba(59,130,246,0.06))' : done ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.03)',
        boxShadow:   isActive ? '0 0 0 1px rgba(139,92,246,0.3),0 0 30px rgba(139,92,246,0.12)' : 'none',
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(isActive ? null : question.id)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left"
      >
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
          style={{
            background: isActive ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.07)',
            color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
            border: `1px solid ${isActive ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${isActive ? 'text-almond' : 'text-white/75'}`}>
            {question.question}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.border} ${meta.color}`}>
              <Icon size={9} />
              {question.type}
            </span>
            {done && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  attempt?.correct === false
                    ? 'bg-red-500/10 text-red-300 border-red-400/20'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20'
                }`}
              >
                <CheckCircle2 size={9} />
                {attempt?.correct === false ? 'Incorrect' : 'Answered'}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-white/30">
            {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>
    </Motion.div>
  )
}

// ─── Default export: auto-routes to MCQ or Theory card ───────────────────────
function QuestionCard(props) {
  const isMcq = Array.isArray(props.question?.options) && props.question.options.length > 0
  if (isMcq) {
    return (
      <McqCard
        question={props.question}
        index={props.index}
        selectedAnswer={props.selectedAnswer}
        onSelect={props.onSelectAnswer}
        result={props.result}
      />
    )
  }
  return (
    <TheoryCard
      question={props.question}
      index={props.index}
      isActive={props.isActive}
      onSelect={props.onSelect}
      attempt={props.attempt}
    />
  )
}

export default QuestionCard
