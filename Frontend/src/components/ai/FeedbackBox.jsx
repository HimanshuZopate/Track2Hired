import { motion as Motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Lightbulb, RefreshCcw, TrendingUp, XCircle } from 'lucide-react'

function FeedbackBox({ feedback, onReset }) {
  if (!feedback) return null

  const { isCorrect, matchScore, correctAnswer, explanation, skillProgress } = feedback

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.92, y: 18 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      exit={{ opacity: 0, scale: 0.94, y: 12 }}
      transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: isCorrect ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.35)',
        background:  isCorrect
          ? 'linear-gradient(145deg, rgba(16,185,129,0.08), rgba(14,15,22,0.92))'
          : 'linear-gradient(145deg, rgba(239,68,68,0.08), rgba(14,15,22,0.92))',
        boxShadow: isCorrect
          ? '0 0 0 1px rgba(16,185,129,0.2), 0 8px 40px rgba(16,185,129,0.08)'
          : '0 0 0 1px rgba(239,68,68,0.2), 0 8px 40px rgba(239,68,68,0.08)',
      }}
    >
      {/* Result banner */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{
          borderBottom: `1px solid ${isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
        }}
      >
        <Motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background:  isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border:      isCorrect ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
            boxShadow:   isCorrect ? '0 0 20px rgba(16,185,129,0.3)' : '0 0 20px rgba(239,68,68,0.25)',
          }}
        >
          {isCorrect
            ? <CheckCircle2 size={20} className="text-emerald-400" />
            : <XCircle      size={20} className="text-red-400" />
          }
        </Motion.div>

        <div>
          <p className={`text-base font-bold ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
            {isCorrect ? 'Correct! 🎉' : 'Not Quite Right'}
          </p>
          <p className="text-xs text-white/45">
            {matchScore !== undefined
              ? `Keyword match: ${matchScore}% — ${isCorrect ? 'above threshold' : 'below 40% threshold'}`
              : isCorrect ? 'Good answer!' : 'Review the model answer below.'}
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">

        {/* Model answer — revealed after submission */}
        {correctAnswer && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-emerald-400/70">
              <CheckCircle2 size={11} />
              Model Answer
            </div>
            <div
              className="rounded-xl px-4 py-3 text-sm text-white/80 leading-relaxed"
              style={{
                background: 'rgba(16,185,129,0.06)',
                borderLeft: '3px solid rgba(16,185,129,0.4)',
              }}
            >
              {correctAnswer}
            </div>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-blue-400/70">
              <Lightbulb size={11} />
              Explanation &amp; Hints
            </div>
            <div
              className="rounded-xl px-4 py-3 text-sm text-white/70 leading-relaxed"
              style={{
                background: 'rgba(59,130,246,0.06)',
                borderLeft: '3px solid rgba(59,130,246,0.35)',
              }}
            >
              {explanation}
            </div>
          </div>
        )}

        {/* Skill progress */}
        {skillProgress?.improved && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-cyan-300/80">
              <TrendingUp size={11} />
              Skill Progress
            </div>
            <div
              className="rounded-xl px-4 py-3 text-sm text-cyan-100/85 leading-relaxed"
              style={{
                background: 'rgba(34,211,238,0.08)',
                borderLeft: '3px solid rgba(34,211,238,0.4)',
              }}
            >
              {skillProgress.created ? (
                <>New skill <strong>{skillProgress.skillName}</strong> added with confidence <strong>{skillProgress.newConfidence}/5</strong>.</>
              ) : (
                <><strong>{skillProgress.skillName}</strong> confidence +{skillProgress.delta} → now <strong>{skillProgress.newConfidence}/5</strong>.</>
              )}
            </div>
          </div>
        )}

        {/* Improvement tip for wrong answers */}
        {!isCorrect && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-amber-400/70">
              <BookOpen size={11} />
              How to Improve
            </div>
            <div
              className="rounded-xl px-4 py-3 text-xs text-white/65 leading-relaxed"
              style={{
                background: 'rgba(245,158,11,0.06)',
                borderLeft: '3px solid rgba(245,158,11,0.35)',
              }}
            >
              Review the model answer above, then try again. Focus on the key concepts —
              aim to include them naturally in your explanation.
            </div>
          </div>
        )}

        {/* Try again */}
        <Motion.button
          type="button"
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <RefreshCcw size={13} />
          Try Again / Next Question
        </Motion.button>
      </div>
    </Motion.div>
  )
}

export default FeedbackBox
