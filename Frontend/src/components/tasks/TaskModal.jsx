import { AnimatePresence, motion as Motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const PRIORITIES = ['Low', 'Medium', 'High']
const STATUSES   = ['Pending', 'In Progress', 'Completed']

const BLANK = {
  title:       '',
  description: '',
  priority:    'Medium',
  status:      'Pending',
  dueDate:     '',
  dueTime:     '',
}

const PRIORITY_COLORS = {
  Low:    { accent: '#34d399', glow: 'rgba(16,185,129,0.35)'  },
  Medium: { accent: '#fbbf24', glow: 'rgba(245,158,11,0.35)'  },
  High:   { accent: '#f87171', glow: 'rgba(239,68,68,0.4)'    },
}

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.88, y: 28 },
  visible: { opacity: 1, scale: 1,    y: 0  },
  exit:    { opacity: 0, scale: 0.9,  y: 18 },
}

// Extract date string (YYYY-MM-DD) and time string (HH:MM) from an ISO date
const splitDateTime = (isoStr) => {
  if (!isoStr) return { date: '', time: '' }
  const d = new Date(isoStr)
  const date = d.toISOString().slice(0, 10)
  const time = d.toTimeString().slice(0, 5)
  return { date, time }
}

function TaskModal({ open, onClose, onSubmit, initialData = null, loading = false }) {
  const [form, setForm]   = useState(BLANK)
  const [errors, setErrors] = useState({})
  const firstRef = useRef(null)
  const isEdit   = Boolean(initialData)

  useEffect(() => {
    if (open) {
      if (initialData) {
        const { date, time } = splitDateTime(initialData.dueDate)
        setForm({
          title:       initialData.title       || '',
          description: initialData.description || '',
          priority:    initialData.priority    || 'Medium',
          status:      initialData.status      || 'Pending',
          dueDate:     date,
          dueTime:     time,
        })
      } else {
        setForm(BLANK)
      }
      setErrors({})
      setTimeout(() => firstRef.current?.focus(), 80)
    }
  }, [open, initialData])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.title.trim())          next.title = 'Title is required'
    else if (form.title.trim().length < 2) next.title = 'Minimum 2 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    // Build a proper ISO8601 string directly without local-to-UTC shift issues.
    // "YYYY-MM-DDTHH:MM:SS.000Z" is always accepted by express-validator isISO8601().
    let dueDate = undefined
    if (form.dueDate) {
      const timeStr = form.dueTime || '00:00'
      // Pad to HH:MM:SS
      const isoString = `${form.dueDate}T${timeStr}:00.000Z`
      // Validate the date is not NaN before sending
      const parsed = new Date(isoString)
      if (!isNaN(parsed.getTime())) {
        dueDate = isoString
      }
    }

    onSubmit({
      title:       form.title.trim(),
      description: form.description.trim() || undefined,
      priority:    form.priority,
      status:      form.status,
      ...(dueDate !== undefined && { dueDate }),
    })
  }

  const pColor = PRIORITY_COLORS[form.priority] || PRIORITY_COLORS.Medium

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <Motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <Motion.div
              className="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10"
              style={{
                background:
                  'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(14,15,20,0.95) 100%)',
                backdropFilter: 'blur(28px)',
                boxShadow: `0 0 0 1px ${pColor.glow}, 0 28px 70px rgba(0,0,0,0.65), 0 0 60px ${pColor.glow}`,
              }}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              {/* Ambient orb */}
              <div
                className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full opacity-20"
                style={{ background: `radial-gradient(circle, ${pColor.accent}, transparent 70%)`, filter: 'blur(28px)' }}
              />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
                <div>
                  <h2 className="text-base font-semibold text-almond">{isEdit ? 'Edit Task' : 'New Task'}</h2>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {isEdit ? 'Update task details below' : 'Add something to conquer today'}
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
              <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-5">

                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/55">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    ref={firstRef}
                    type="text"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="What needs to be done?"
                    className={`w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-almond placeholder-white/20 outline-none transition-all focus:bg-white/[0.07] ${
                      errors.title
                        ? 'border-red-400/50 focus:border-red-400'
                        : 'border-white/10 focus:border-blue-500/60 focus:shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
                    }`}
                  />
                  {errors.title && <p className="mt-1 text-[11px] text-red-400">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/55">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Optional details, notes, resources…"
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-almond placeholder-white/20 outline-none transition-all focus:border-blue-500/60 focus:bg-white/[0.07]"
                  />
                </div>

                {/* Priority + Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/55">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => set('priority', e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111218] px-3 py-2.5 text-sm text-almond outline-none focus:border-blue-500/50"
                    >
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/55">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => set('status', e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111218] px-3 py-2.5 text-sm text-almond outline-none focus:border-blue-500/50"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Due date + time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/55">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => set('dueDate', e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111218] px-3 py-2.5 text-sm text-almond outline-none focus:border-blue-500/50 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/55">Due Time</label>
                    <input
                      type="time"
                      value={form.dueTime}
                      onChange={(e) => set('dueTime', e.target.value)}
                      disabled={!form.dueDate}
                      className="w-full rounded-xl border border-white/10 bg-[#111218] px-3 py-2.5 text-sm text-almond outline-none focus:border-blue-500/50 disabled:opacity-40 [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </button>
                  <Motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.97 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${pColor.accent}88, rgba(139,92,246,0.85))`,
                      boxShadow: loading ? 'none' : `0 0 22px ${pColor.glow}`,
                    }}
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : isEdit ? 'Update Task' : 'Create Task'}
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

export default TaskModal
