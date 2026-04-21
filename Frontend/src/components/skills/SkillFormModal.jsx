import { AnimatePresence, motion as Motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const CATEGORIES = ['Technical', 'HR', 'Behavioral']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

const BLANK = {
  skillName: '',
  category: 'Technical',
  level: 'Beginner',
  confidenceScore: 3,
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
}

const CONFIDENCE_LABELS = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Expert']
const CONFIDENCE_COLORS = ['', '#f87171', '#fbbf24', '#facc15', '#60a5fa', '#34d399']

function SkillFormModal({ open, onClose, onSubmit, initialData = null, loading = false }) {
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const firstRef = useRef(null)
  const isEdit = Boolean(initialData)

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              skillName: initialData.skillName || '',
              category: initialData.category || 'Technical',
              level: initialData.level || 'Beginner',
              confidenceScore: initialData.confidenceScore ?? 3,
            }
          : BLANK,
      )
      setErrors({})
      setTimeout(() => firstRef.current?.focus(), 80)
    }
  }, [open, initialData])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const validate = () => {
    const next = {}
    if (!form.skillName.trim()) next.skillName = 'Skill name is required'
    else if (form.skillName.trim().length < 2) next.skillName = 'Minimum 2 characters'
    if (!form.category) next.category = 'Category is required'
    if (!form.level) next.level = 'Level is required'
    if (!form.confidenceScore) next.confidenceScore = 'Confidence score is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, confidenceScore: Number(form.confidenceScore) })
  }

  const sliderVal = Number(form.confidenceScore)
  const sliderColor = CONFIDENCE_COLORS[sliderVal] || '#60a5fa'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <Motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <Motion.div
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10"
              style={{
                background:
                  'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(18,18,24,0.92) 100%)',
                backdropFilter: 'blur(24px)',
                boxShadow:
                  '0 0 0 1px rgba(59,130,246,0.2), 0 24px 64px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.12)',
              }}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              {/* Ambient orb */}
              <div
                className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20"
                style={{
                  background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
                  filter: 'blur(24px)',
                }}
              />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
                <div>
                  <h2 className="text-base font-semibold text-almond">
                    {isEdit ? 'Edit Skill' : 'Add New Skill'}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {isEdit ? 'Update your skill information' : 'Track a new skill in your arsenal'}
                  </p>
                </div>
                <Motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </Motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
                {/* Skill Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    Skill Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    ref={firstRef}
                    type="text"
                    value={form.skillName}
                    onChange={(e) => handleChange('skillName', e.target.value)}
                    placeholder="e.g. React.js, System Design…"
                    className={`w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-almond placeholder-white/25 outline-none transition-all focus:bg-white/[0.06] ${
                      errors.skillName
                        ? 'border-red-400/50 focus:border-red-400/80'
                        : 'border-white/10 focus:border-blue-500/60 focus:shadow-[0_0_0_1px_rgba(59,130,246,0.35)]'
                    }`}
                  />
                  {errors.skillName && (
                    <p className="mt-1 text-[11px] text-red-400">{errors.skillName}</p>
                  )}
                </div>

                {/* Category + Level row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/60">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className={`w-full rounded-xl border bg-[#111218] px-3 py-2.5 text-sm text-almond outline-none transition-all focus:border-blue-500/60 ${
                        errors.category ? 'border-red-400/50' : 'border-white/10'
                      }`}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-[11px] text-red-400">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/60">
                      Level <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.level}
                      onChange={(e) => handleChange('level', e.target.value)}
                      className={`w-full rounded-xl border bg-[#111218] px-3 py-2.5 text-sm text-almond outline-none transition-all focus:border-blue-500/60 ${
                        errors.level ? 'border-red-400/50' : 'border-white/10'
                      }`}
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                    {errors.level && (
                      <p className="mt-1 text-[11px] text-red-400">{errors.level}</p>
                    )}
                  </div>
                </div>

                {/* Confidence slider */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium text-white/60">
                      Confidence Score <span className="text-red-400">*</span>
                    </label>
                    <span
                      className="rounded-lg px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        color: sliderColor,
                        background: `${sliderColor}18`,
                        border: `1px solid ${sliderColor}35`,
                      }}
                    >
                      {sliderVal} / 5 · {CONFIDENCE_LABELS[sliderVal]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={form.confidenceScore}
                    onChange={(e) => handleChange('confidenceScore', e.target.value)}
                    className="w-full cursor-pointer accent-blue-500"
                    style={{ accentColor: sliderColor }}
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-white/25">
                    <span>Very Low</span>
                    <span>Low</span>
                    <span>Moderate</span>
                    <span>High</span>
                    <span>Expert</span>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </button>
                  <Motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.97 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(139,92,246,0.9))',
                      boxShadow: loading ? 'none' : '0 0 20px rgba(59,130,246,0.35)',
                    }}
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : isEdit ? (
                      'Update Skill'
                    ) : (
                      'Add Skill'
                    )}
                  </Motion.button>
                </div>
              </form>
            </Motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SkillFormModal
