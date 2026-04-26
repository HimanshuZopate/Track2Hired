import { motion as Motion } from 'framer-motion'
import { CheckCircle2, Circle, MessageSquareDashed, Send, X } from 'lucide-react'

/**
 * AnswerPanel
 *
 * MCQ  (question.options.length > 0) → radio button list
 * Theory                             → free-text textarea
 *
 * onSubmit() is called with no args — the parent reads `answer` state.
 */
function AnswerPanel({ question, answer, onChange, onSubmit, onClose, submitting }) {
  if (!question) return null

  const isMcq = Array.isArray(question.options) && question.options.length > 0
  const canSubmit = answer.trim().length >= 1 && !submitting

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
              {isMcq ? 'Select the Correct Option' : 'Your Answer'}
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

      {/* Input area */}
      <div className="px-5 py-4">
        {isMcq ? (
          /* ── MCQ Radio Buttons ── */
          <div className="space-y-2.5">
            {question.options.map((opt, i) => {
              const selected = answer === opt
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange(opt)}
                  className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all"
                  style={{
                    borderColor: selected ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)',
                    background: selected
                      ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))'
                      : 'rgba(255,255,255,0.03)',
                    boxShadow: selected ? '0 0 0 1px rgba(139,92,246,0.25)' : 'none',
                  }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: selected ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {selected
                      ? <CheckCircle2 size={13} className="text-purple-400" />
                      : <Circle size={13} className="text-white/20" />
                    }
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: selected ? '#e2d9f3' : 'rgba(255,255,255,0.65)' }}
                  >
                    <span className="mr-2 text-[11px] font-bold"
                      style={{ color: selected ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          /* ── Theory Textarea ── */
          <>
            <textarea
              rows={6}
              value={answer}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Type your answer here… Explain your reasoning clearly."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-almond placeholder-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
            />
            <p className={`mt-1.5 text-[11px] ${answer.trim().length < 10 ? 'text-white/30' : 'text-white/40'}`}>
              {answer.trim().length} characters
              {answer.trim().length < 10 && ' (min 10)'}
            </p>
          </>
        )}
      </div>

      {/* Submit */}
      <div className="border-t border-white/[0.07] px-5 py-4">
        <p className="mb-3 text-[11px] text-white/35">
          {isMcq
            ? 'Select an option above, then submit — the system will check your answer.'
            : 'Submit your answer — the system will evaluate it automatically.'}
        </p>
        <Motion.button
          type="button"
          disabled={!canSubmit}
          whileHover={{ scale: canSubmit ? 1.02 : 1 }}
          whileTap={{ scale: canSubmit ? 0.97 : 1 }}
          onClick={onSubmit}
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
              {isMcq ? 'Submit Answer' : 'Submit & Evaluate'}
            </>
          )}
        </Motion.button>
      </div>
    </Motion.div>
  )
}

export default AnswerPanel
