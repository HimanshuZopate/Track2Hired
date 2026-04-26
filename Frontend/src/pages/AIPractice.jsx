import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  History,
  Trophy,
  X,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import AnswerPanel from '../components/ai/AnswerPanel'
import FeedbackBox from '../components/ai/FeedbackBox'
import InputControls from '../components/ai/InputControls'
import QuestionCard from '../components/ai/QuestionCard'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

// ─── safe API call ────────────────────────────────────────────────────────────
const safeCall = async (fn) => {
  try   { return { data: (await fn()).data, error: null } }
  catch (err) {
    console.error('[AI]', err?.response?.status, err?.response?.data || err?.message)
    return { data: null, error: err?.response?.data?.message || err?.message || 'Request failed' }
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null
  return (
    <AnimatePresence>
      <Motion.div
        key={toast.id}
        initial={{ opacity: 0, y: 24, scale: 0.92 }}
        animate={{ opacity: 1, y: 0,   scale: 1    }}
        exit={{ opacity: 0, y: 16, scale: 0.9 }}
        transition={{ duration: 0.28 }}
        className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-medium backdrop-blur-md md:bottom-8"
        style={
          toast.type === 'error'
            ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5', boxShadow: '0 0 20px rgba(239,68,68,0.15)' }
            : { background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7', boxShadow: '0 0 20px rgba(16,185,129,0.15)' }
        }
      >
        {toast.message}
      </Motion.div>
    </AnimatePresence>
  )
}

// ─── History drawer ───────────────────────────────────────────────────────────
function HistoryDrawer({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <Motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <Motion.aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#111218] p-6" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 240, damping: 26 }}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-blue-400" />
                <h2 className="text-sm font-semibold text-almond">Session History</h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <BookOpen size={28} className="mb-3 text-white/20" />
              <p className="text-sm text-white/35">AI sessions are not persisted — start a new session anytime.</p>
            </div>
          </Motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <Motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(139,92,246,0.1)', boxShadow: '0 0 24px rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <Brain size={24} className="text-purple-400" />
      </div>
      <h3 className="text-base font-semibold text-almond">No questions yet</h3>
      <p className="mt-1.5 max-w-xs text-sm text-white/40">Configure your session on the left and click <strong className="text-white/70">Generate Questions</strong>.</p>
    </Motion.div>
  )
}

// ─── MCQ Score Summary ────────────────────────────────────────────────────────
function McqScoreSummary({ results, total, skillProgress, onReset }) {
  const correct = Object.values(results).filter(r => r.correct).length
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0
  const great   = pct >= 70

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.93, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: great ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)',
        background: great
          ? 'linear-gradient(145deg,rgba(16,185,129,0.09),rgba(14,15,22,0.95))'
          : 'linear-gradient(145deg,rgba(245,158,11,0.09),rgba(14,15,22,0.95))',
        boxShadow: great ? '0 0 0 1px rgba(16,185,129,0.15),0 8px 40px rgba(16,185,129,0.08)' : '0 0 0 1px rgba(245,158,11,0.15),0 8px 40px rgba(245,158,11,0.07)',
      }}
    >
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.06]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl font-black"
          style={{ background: great ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: great ? '#34d399' : '#fbbf24' }}>
          {pct}%
        </div>
        <div>
          <p className={`text-base font-bold ${great ? 'text-emerald-300' : 'text-amber-300'}`}>
            {great ? '🎉 Great work!' : 'Keep practicing!'}
          </p>
          <p className="text-xs text-white/45">{correct} of {total} questions correct</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Score bar */}
        <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: great ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#fbbf24,#f59e0b)' }}
          />
        </div>

        {skillProgress?.improved && (
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.07] px-4 py-2.5 text-xs text-cyan-200">
            🚀 <strong>{skillProgress.skillName}</strong> confidence improved by <strong>+{skillProgress.delta}</strong> → <strong>{skillProgress.newConfidence}/5</strong>
          </div>
        )}

        <button
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Try Another Session
        </button>
      </div>
    </Motion.div>
  )
}

// ─── Session stats (Theory mode) ──────────────────────────────────────────────
function SessionStats({ questions, attempts }) {
  const total = questions.length
  const attempted = Object.keys(attempts).length
  const correct   = Object.values(attempts).filter(a => a.correct).length
  return (
    <Motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 grid grid-cols-3 gap-3">
      {[
        { label: 'Questions', value: total,     color: 'text-white'        },
        { label: 'Attempted', value: attempted, color: 'text-blue-300'     },
        { label: 'Correct',   value: correct,   color: 'text-emerald-300'  },
      ].map(s => (
        <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-center">
          <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-white/35">{s.label}</p>
        </div>
      ))}
    </Motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════
function AIPractice() {
  const [form, setForm] = useState({ skill: '', difficulty: 'Intermediate', type: 'MCQ', count: 5 })

  // Shared
  const [questions,   setQuestions]   = useState([])
  const [sessionId,   setSessionId]   = useState(null)
  const [sessionType, setSessionType] = useState('MCQ')   // tracks type of current session
  const [generating,  setGenerating]  = useState(false)
  const [genError,    setGenError]    = useState('')
  const [fallbackMsg, setFallbackMsg] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [toast,       setToast]       = useState(null)

  // ── MCQ state ────────────────────────────────────────────────────────────
  const [mcqAnswers,    setMcqAnswers]    = useState({})   // { qId: selectedOption }
  const [mcqResults,    setMcqResults]    = useState(null) // { qId: { correct, correctAnswer, explanation } }
  const [mcqSubmitting, setMcqSubmitting] = useState(false)
  const [mcqSkill,      setMcqSkill]      = useState(null) // skillProgress after batch eval

  // ── Theory state ─────────────────────────────────────────────────────────
  const [activeId,   setActiveId]   = useState(null)
  const [answer,     setAnswer]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback,   setFeedback]   = useState(null)
  const [attempts,   setAttempts]   = useState({})          // { qId: { correct } }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
    setTimeout(() => setToast(null), 3400)
  }, [])

  const setField = useCallback((key, val) => setForm(prev => ({ ...prev, [key]: val })), [])

  const activeQuestion = useMemo(() => questions.find(q => q.id === activeId) || null, [questions, activeId])
  const isMcqSession   = sessionType === 'MCQ'
  const mcqAnsweredCount = Object.keys(mcqAnswers).length

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!form.skill.trim()) { showToast('Enter a topic first', 'error'); return }

    setGenerating(true); setGenError(''); setFallbackMsg('')
    setQuestions([]); setSessionId(null); setSessionType(form.type)
    setActiveId(null); setAnswer(''); setFeedback(null); setAttempts({})
    setMcqAnswers({}); setMcqResults(null); setMcqSkill(null)

    const { data, error } = await safeCall(() =>
      api.post('/api/ai/generate', {
        skill: form.skill.trim(), difficulty: form.difficulty,
        type: form.type, count: form.count,
      })
    )
    setGenerating(false)

    if (error) { setGenError(error); return }

    setQuestions(data.questions || [])
    setSessionId(data.sessionId || data.generatedId || null)
    if (data.usedFallback) setFallbackMsg('AI busy — showing curated backup questions.')
    showToast(`${data.questions?.length || 0} ${form.type} questions ready!`)
  }

  // ── MCQ: select option ────────────────────────────────────────────────────
  const handleMcqSelect = useCallback((qId, option) => {
    if (mcqResults) return // locked after submit
    setMcqAnswers(prev => ({ ...prev, [qId]: option }))
  }, [mcqResults])

  // ── MCQ: submit all ───────────────────────────────────────────────────────
  const handleMcqSubmit = async () => {
    if (mcqAnsweredCount === 0) { showToast('Select at least one answer', 'error'); return }
    setMcqSubmitting(true)

    const { data, error } = await safeCall(() =>
      api.post('/api/ai/evaluate-all', { sessionId, answers: mcqAnswers })
    )
    setMcqSubmitting(false)

    if (error) { showToast(error, 'error'); return }

    setMcqResults(data.results)
    setMcqSkill(data.skillProgress)
    const c = data.correctCount, t = data.total
    showToast(`${c}/${t} correct${data.skillProgress?.improved ? ' — skill improved! 🚀' : ''}`, c > 0 ? 'success' : 'error')
  }

  // ── Theory: select question ───────────────────────────────────────────────
  const handleTheorySelect = (id) => { setActiveId(id); setAnswer(''); setFeedback(null) }

  // ── Theory: submit answer ─────────────────────────────────────────────────
  const handleTheorySubmit = async () => {
    const isMcqQuestion = Array.isArray(activeQuestion?.options) && activeQuestion.options.length > 0
    const minLen = isMcqQuestion ? 1 : 10
    if (!activeQuestion || answer.trim().length < minLen) return
    setSubmitting(true)

    const { data, error } = await safeCall(() =>
      api.post('/api/ai/answer', {
        sessionId, questionId: activeQuestion.id,
        userAnswer: answer.trim(), topic: form.skill.trim(), difficulty: form.difficulty,
      })
    )
    setSubmitting(false)

    if (error) { showToast(error, 'error'); return }

    setAttempts(prev => ({ ...prev, [activeQuestion.id]: { correct: data.correct } }))
    setFeedback({
      isCorrect: data.correct, matchScore: data.matchScore,
      correctAnswer: data.correctAnswer, explanation: data.explanation,
      skillProgress: data.skillProgress,
    })
    showToast(
      data.correct ? (data.skillProgress?.improved ? '✓ Correct! Skill improved.' : '✓ Correct!') : 'Not quite — review the model answer.',
      data.correct ? 'success' : 'error',
    )
  }

  const resetFeedback = () => { setFeedback(null); setAnswer('') }

  const correctCount = Object.values(attempts).filter(a => a.correct).length

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="mission-dashboard">
      <div className="mission-bg-orb orb-blue" />
      <div className="mission-bg-orb orb-purple" />
      <div className="mission-bg-orb orb-emerald" />

      <Sidebar />

      <Motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 pb-24 md:ml-64 md:pb-8"
      >
        <div className="mx-auto max-w-7xl px-4 py-8">

          {/* Header */}
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-blue-400/70">
                <Brain size={11} /> AI Powered
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-almond">
                Interview{' '}
                <span className="text-blue-400" style={{ textShadow: '0 0 20px rgba(59,130,246,0.6)' }}>Practice</span>
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Generate real interview questions, answer them, and watch your skills grow.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.09] hover:text-white">
                <History size={14} /> History
              </Motion.button>
              {!isMcqSession && questions.length > 0 && (
                <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                  <Trophy size={12} /> {correctCount}/{questions.length} correct
                </Motion.div>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">

            {/* LEFT: Controls */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <InputControls
                form={form} onChange={setField}
                onGenerate={handleGenerate} loading={generating} disabled={generating}
              />
            </div>

            {/* RIGHT: Content */}
            <div className="space-y-5">

              {/* Fallback banner */}
              <AnimatePresence>
                {fallbackMsg && (
                  <Motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-4 py-3 text-xs text-amber-300">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> {fallbackMsg}
                  </Motion.div>
                )}
              </AnimatePresence>

              {/* Generation error */}
              <AnimatePresence>
                {genError && (
                  <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Generation failed</p>
                      <p className="mt-0.5 text-xs opacity-80">{genError}</p>
                      <button onClick={handleGenerate} className="mt-1.5 rounded-lg border border-red-400/25 px-2.5 py-1 text-xs hover:bg-red-500/10 transition">Retry</button>
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>

              {/* Loading skeletons */}
              {generating && (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 animate-pulse rounded-lg bg-white/[0.08]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-4/5 animate-pulse rounded-lg bg-white/[0.08]" />
                          <div className="h-3 w-1/3 animate-pulse rounded-lg bg-white/[0.05]" />
                          {/* Option skeletons for MCQ */}
                          {form.type === 'MCQ' && (
                            <div className="mt-3 space-y-1.5">
                              {[1,2,3,4].map(j => <div key={j} className="h-8 animate-pulse rounded-xl bg-white/[0.04]" />)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══════════ MCQ SESSION ══════════ */}
              {!generating && isMcqSession && questions.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/35">
                      <ClipboardList size={12} />
                      {questions.length} MCQ · {form.skill}
                    </div>
                    <span className="text-[11px] text-white/35">
                      {mcqAnsweredCount}/{questions.length} answered
                    </span>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {questions.map((q, i) => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          index={i}
                          selectedAnswer={mcqAnswers[q.id]}
                          onSelectAnswer={handleMcqSelect}
                          result={mcqResults?.[q.id]}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Submit All — only if not yet submitted */}
                  {!mcqResults && (
                    <Motion.button
                      disabled={mcqAnsweredCount === 0 || mcqSubmitting}
                      whileHover={{ scale: mcqAnsweredCount > 0 ? 1.02 : 1 }}
                      whileTap={{ scale: mcqAnsweredCount > 0 ? 0.97 : 1 }}
                      onClick={handleMcqSubmit}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                      style={{
                        background: mcqAnsweredCount > 0
                          ? 'linear-gradient(135deg,rgba(16,185,129,0.85),rgba(59,130,246,0.85))'
                          : 'rgba(255,255,255,0.06)',
                        boxShadow: mcqAnsweredCount > 0 ? '0 0 30px rgba(16,185,129,0.3)' : 'none',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {mcqSubmitting
                        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        : <><CheckCircle2 size={15} /> Submit All Answers ({mcqAnsweredCount}/{questions.length})</>
                      }
                    </Motion.button>
                  )}

                  {/* MCQ score summary */}
                  {mcqResults && (
                    <McqScoreSummary
                      results={mcqResults}
                      total={questions.length}
                      skillProgress={mcqSkill}
                      onReset={() => {
                        setQuestions([]); setMcqAnswers({}); setMcqResults(null); setMcqSkill(null)
                        setSessionId(null)
                      }}
                    />
                  )}
                </>
              )}

              {/* ══════════ THEORY SESSION ══════════ */}
              {!generating && !isMcqSession && questions.length > 0 && (
                <>
                  <SessionStats questions={questions} attempts={attempts} />
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/35">
                    <ClipboardList size={12} />
                    {questions.length} Questions · {form.skill}
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {questions.map((q, i) => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          index={i}
                          isActive={activeId === q.id}
                          onSelect={handleTheorySelect}
                          attempt={attempts[q.id] ? { correct: attempts[q.id].correct } : null}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Theory answer panel */}
                  <AnimatePresence mode="wait">
                    {activeQuestion && !feedback && (
                      <AnswerPanel
                        key={activeQuestion.id}
                        question={activeQuestion}
                        answer={answer}
                        onChange={setAnswer}
                        onSubmit={handleTheorySubmit}
                        onClose={() => { setActiveId(null); setAnswer(''); setFeedback(null) }}
                        submitting={submitting}
                      />
                    )}
                  </AnimatePresence>

                  {/* Theory feedback */}
                  <AnimatePresence mode="wait">
                    {feedback && activeQuestion && (
                      <FeedbackBox key={`fb-${activeQuestion.id}`} feedback={feedback} onReset={resetFeedback} />
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* Empty state */}
              {!generating && questions.length === 0 && !genError && <EmptyState />}

            </div>
          </div>
        </div>
      </Motion.main>

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <Toast toast={toast} />
    </div>
  )
}

export default AIPractice
