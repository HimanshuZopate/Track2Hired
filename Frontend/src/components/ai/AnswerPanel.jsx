import { motion as Motion } from 'framer-motion'
import { CheckCircle2, MessageSquareDashed, Send, X, XCircle } from 'lucide-react'

function AnswerPanel({ question, answer, onChange, onSubmit, onClose, submitting, existingAttempt }) {
  if (!question) return null

  const minLen = 10
  const canSubmit = answer.trim().length >= minLen && !submitting

  return (
    <Motion.div
      key={question.id}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border border-white/[0.09] backdrop-blur-xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(14,15,22,0.9) 100%)',
        boxShadow: '0 0 0 1px rgba(59,130,246,0.15), 0 16px 60px rgba(0,0,0,0.55)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <MessageSquareDashed size={13} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-white/35">
              Your Answer
            </p>
            <p className="mt-0.5 text-sm leading-snug text-almond">
              {question.question}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/35 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Previous attempt banner */}
      {existingAttempt && (
        <div
          className="flex items-start gap-2.5 border-b border-white/[0.06] px-5 py-3"
          style={{ background: 'rgba(59,130,246,0.06)' }}
        >
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-blue-400" />
          <p className="text-xs text-white/60">
            You've attempted this{' '}
            <span className="font-semibold text-blue-300">{existingAttempt.attemptCount}×</span> — previous answer on file.
            Submitting again increments your attempt counter.
          </p>
        </div>
      )}

      {/* Textarea */}
      <div className="px-5 py-4">
        <textarea
          rows={6}
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here… Be thorough and explain your reasoning."
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-almond placeholder-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <p className={`text-[11px] ${answer.trim().length < minLen ? 'text-white/30' : 'text-white/40'}`}>
            {answer.trim().length} characters
            {answer.trim().length < minLen && ` (min ${minLen})`}
          </p>

          {/* Self-evaluate quick buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => onSubmit(false)}
              className="flex items-center gap-1.5 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-40"
            >
              <XCircle size={12} />
              Incorrect
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => onSubmit(true)}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-40"
            >
              <CheckCircle2 size={12} />
              Correct
            </button>
          </div>
        </div>
      </div>

      {/* Submit bar */}
      <div className="border-t border-white/[0.07] px-5 py-4">
        <p className="mb-3 text-[11px] text-white/35">
          Self-evaluate — did you answer correctly? The system records your attempt and shows model feedback.
        </p>
        <Motion.button
          type="button"
          disabled={!canSubmit}
          whileHover={{ scale: canSubmit ? 1.02 : 1 }}
          whileTap={{ scale: canSubmit ? 0.97 : 1 }}
          onClick={() => onSubmit(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: canSubmit
              ? 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(139,92,246,0.85))'
              : 'rgba(255,255,255,0.07)',
            boxShadow: canSubmit ? '0 0 24px rgba(59,130,246,0.35)' : 'none',
          }}
        >
          {submitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Send size={14} />
              Submit & Get Feedback
            </>
          )}
        </Motion.button>
      </div>
    </Motion.div>
  )
}

export default AnswerPanel
