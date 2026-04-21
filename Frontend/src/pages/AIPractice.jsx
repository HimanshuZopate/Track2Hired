import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  AlertCircle,
  BookOpen,
  Brain,
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

// ─── safe API wrapper ─────────────────────────────────────────────────────────
const safeCall = async (fn) => {
  try {
    const res = await fn()
    return { data: res.data, error: null }
  } catch (err) {
    console.error('[AI API]', err?.response?.status, err?.response?.data || err?.message)
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
        animate={{ opacity: 1, y: 0, scale: 1 }}
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
function HistoryDrawer({ open, onClose, history, onRestore }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <Motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <Motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#111218] p-6"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-blue-400" />
                <h2 className="text-sm font-semibold text-almond">Session History</h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <BookOpen size={28} className="mb-3 text-white/20" />
                <p className="text-sm text-white/35">No sessions yet. Generate your first set!</p>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto">
                {history.map((h, i) => (
                  <button
                    key={h._id || i}
                    onClick={() => { onRestore(h); onClose() }}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left transition hover:border-blue-400/25 hover:bg-blue-500/[0.06]"
                  >
                    <p className="text-sm font-medium text-almond">{h.skill}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="text-[11px] text-white/40">{h.difficulty}</span>
                      <span className="text-[11px] text-white/25">·</span>
                      <span className="text-[11px] text-white/40">{h.type}</span>
                      <span className="text-[11px] text-white/25">·</span>
                      <span className="text-[11px] text-white/40">{h.questions?.length || 0}q</span>
                    </div>
                    <p className="mt-1 text-[10px] text-white/25">
                      {new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Empty questions state ────────────────────────────────────────────────────
function EmptyQuestions() {
  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center"
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(139,92,246,0.1)', boxShadow: '0 0 24px rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.2)' }}
      >
        <Brain size={24} className="text-purple-400" />
      </div>
      <h3 className="text-base font-semibold text-almond">No questions yet</h3>
      <p className="mt-1.5 max-w-xs text-sm text-white/40">
        Configure your session on the left and click <strong className="text-white/70">Generate Questions</strong>.
      </p>
    </Motion.div>
  )
}

// ─── Session stats bar ────────────────────────────────────────────────────────
function SessionStats({ questions, attempts }) {
  const total     = questions.length
  const attempted = Object.keys(attempts).length
  const correct   = Object.values(attempts).filter((a) => a.isCorrect).length

  return (
    <Motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 grid grid-cols-3 gap-3"
    >
      {[
        { label: 'Questions', value: total,     color: 'text-white' },
        { label: 'Attempted', value: attempted, color: 'text-blue-300' },
        { label: 'Correct',   value: correct,   color: 'text-emerald-300' },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-center"
        >
          <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-white/35">{s.label}</p>
        </div>
      ))}
    </Motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AIPractice() {
  const [form, setForm] = useState({ skill: '', difficulty: 'Intermediate', type: 'Theory', count: 5 })

  // Questions state
  const [questions,   setQuestions]   = useState([])
  const [generatedId, setGeneratedId] = useState(null)
  const [generating,  setGenerating]  = useState(false)
  const [genError,    setGenError]    = useState('')
  const [fallbackMsg, setFallbackMsg] = useState('')

  // Interaction state
  const [activeId,    setActiveId]    = useState(null)
  const [answer,      setAnswer]      = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [feedback,    setFeedback]    = useState(null) // { isCorrect, attemptCount, question }

  // Per-question attempt cache { questionId → attempt doc }
  const [attempts,    setAttempts]    = useState({})

  // History drawer
  const [history,      setHistory]      = useState([])
  const [historyOpen,  setHistoryOpen]  = useState(false)
  const [historyLoaded,setHistoryLoaded]= useState(false)

  // Toast
  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
    setTimeout(() => setToast(null), 3400)
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setField = useCallback((key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
  }, [])

  const activeQuestion = useMemo(
    () => questions.find((q) => q.id === activeId) || null,
    [questions, activeId],
  )

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!form.skill.trim()) { showToast('Enter a skill first', 'error'); return }
    setGenerating(true)
    setGenError('')
    setFallbackMsg('')
    setQuestions([])
    setActiveId(null)
    setAnswer('')
    setFeedback(null)
    setAttempts({})
    setGeneratedId(null)

    const { data, error } = await safeCall(() =>
      api.post('/api/ai/generate', {
        skill:      form.skill.trim(),
        difficulty: form.difficulty,
        type:       form.type,
        count:      form.count,
      }),
    )
    setGenerating(false)

    if (error) { setGenError(error); return }

    setQuestions(data.questions || [])
    setGeneratedId(data.generatedId || null)

    if (data.usedFallback) {
      setFallbackMsg(data.providerError
        ? `AI provider issue (${data.providerError}). Using curated backup questions.`
        : 'AI provider unavailable — showing curated backup questions.',
      )
    }
    showToast(`${data.questions?.length || 0} questions ready!`)
  }

  // ── Select question ───────────────────────────────────────────────────────
  const handleSelect = (id) => {
    setActiveId(id)
    setAnswer('')
    setFeedback(null)
  }

  // ── Submit answer ─────────────────────────────────────────────────────────
  const handleSubmit = async (isCorrect) => {
    if (!activeQuestion || answer.trim().length < 10) return
    setSubmitting(true)

    const { data, error } = await safeCall(() =>
      api.post('/api/ai/attempt', {
        questionId: activeQuestion.id,
        userAnswer: answer.trim(),
        isCorrect,
        generatedId,
        skillName: form.skill.trim(),
        difficulty: form.difficulty,
      }),
    )
    setSubmitting(false)

    if (error) { showToast(error, 'error'); return }

    const atm = data.attempt
    setAttempts((prev) => ({ ...prev, [activeQuestion.id]: atm }))
    setFeedback({
      isCorrect,
      attemptCount: atm.attemptCount,
      attempt: atm,
      skillProgress: data.skillProgress,
      readiness: data.readiness,
    })
    showToast(
      isCorrect
        ? data.skillProgress?.improved
          ? '✓ Correct! Your skill improved.'
          : '✓ Correct! Great job.'
        : 'Noted — review the model answer.'
    )
  }

  // ── Reset feedback → allow re-answer ─────────────────────────────────────
  const resetFeedback = () => {
    setFeedback(null)
    setAnswer('')
  }

  // ── Load history ──────────────────────────────────────────────────────────
  const loadHistory = async () => {
    if (historyLoaded && history.length) { setHistoryOpen(true); return }
    const { data, error } = await safeCall(() => api.get('/api/ai/history'))
    if (error) { showToast('Could not load history', 'error'); return }
    setHistory(data.history || [])
    setHistoryLoaded(true)
    setHistoryOpen(true)
  }

  // ── Restore a history session ─────────────────────────────────────────────
  const restoreSession = (session) => {
    setForm((prev) => ({
      ...prev,
      skill:      session.skill,
      difficulty: session.difficulty,
      type:       session.type,
    }))
    setQuestions(session.questions || [])
    setActiveId(null)
    setAnswer('')
    setFeedback(null)
    setAttempts({})
    showToast(`Restored: ${session.skill} session`)
  }

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

          {/* ── Page header ── */}
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-blue-400/70">
                <Brain size={11} />
                AI Powered
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-almond">
                Interview{' '}
                <span className="text-blue-400" style={{ textShadow: '0 0 20px rgba(59,130,246,0.6)' }}>
                  Practice
                </span>
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Generate dynamic questions, practice answers, and track your progress
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* History button */}
              <Motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={loadHistory}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.09] hover:text-white"
              >
                <History size={14} />
                History
              </Motion.button>

              {/* Stats chip */}
              {questions.length > 0 && (
                <Motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300"
                >
                  <Trophy size={12} />
                  {Object.values(attempts).filter((a) => a.isCorrect).length}/{questions.length} correct
                </Motion.div>
              )}
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">

            {/* ── LEFT: Input Controls ── */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <InputControls
                form={form}
                onChange={setField}
                onGenerate={handleGenerate}
                loading={generating}
                disabled={generating}
              />
            </div>

            {/* ── RIGHT: Questions + Answer + Feedback ── */}
            <div className="space-y-5">

              {/* Fallback banner */}
              <AnimatePresence>
                {fallbackMsg && (
                  <Motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-4 py-3 text-xs text-amber-300"
                  >
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    {fallbackMsg}
                  </Motion.div>
                )}
              </AnimatePresence>

              {/* Generation error */}
              <AnimatePresence>
                {genError && (
                  <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300"
                  >
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Generation failed</p>
                      <p className="mt-0.5 text-xs opacity-80">{genError}</p>
                      <button
                        onClick={handleGenerate}
                        className="mt-1.5 rounded-lg border border-red-400/25 px-2.5 py-1 text-xs hover:bg-red-500/10 transition"
                      >
                        Retry
                      </button>
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>

              {/* Loading state */}
              {generating && (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 animate-pulse rounded-lg bg-white/[0.08]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-4/5 animate-pulse rounded-lg bg-white/[0.08]" />
                          <div className="h-3 w-1/3 animate-pulse rounded-lg bg-white/[0.05]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Questions list */}
              {!generating && questions.length > 0 && (
                <>
                  {/* Stats bar */}
                  <SessionStats questions={questions} attempts={attempts} />

                  {/* Section label */}
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
                          onSelect={handleSelect}
                          attempt={attempts[q.id] || null}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Empty state */}
              {!generating && questions.length === 0 && !genError && (
                <EmptyQuestions />
              )}

              {/* ── Answer Panel ── */}
              <AnimatePresence mode="wait">
                {activeQuestion && !feedback && (
                  <AnswerPanel
                    key={activeQuestion.id}
                    question={activeQuestion}
                    answer={answer}
                    onChange={setAnswer}
                    onSubmit={handleSubmit}
                    onClose={() => { setActiveId(null); setAnswer(''); setFeedback(null) }}
                    submitting={submitting}
                    existingAttempt={attempts[activeQuestion.id] || null}
                  />
                )}
              </AnimatePresence>

              {/* ── Feedback Box ── */}
              <AnimatePresence mode="wait">
                {feedback && activeQuestion && (
                  <FeedbackBox
                    key={`fb-${activeQuestion.id}-${feedback.attemptCount}`}
                    feedback={feedback}
                    question={activeQuestion}
                    onReset={resetFeedback}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Motion.main>

      {/* History Drawer */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onRestore={restoreSession}
      />

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  )
}

export default AIPractice
