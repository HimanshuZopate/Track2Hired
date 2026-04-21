import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  AlertCircle,
  CheckSquare,
  ClipboardList,
  ListTodo,
  Plus,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import TaskCard, { isOverdue, isToday } from '../components/tasks/TaskCard'
import TaskDetailPanel from '../components/tasks/TaskDetailPanel'
import TaskFilters from '../components/tasks/TaskFilters'
import TaskModal from '../components/tasks/TaskModal'
import api from '../services/api'

// ─── helpers ──────────────────────────────────────────────────────────────────
const safeCall = async (fn) => {
  try {
    const res = await fn()
    return { data: res.data, error: null }
  } catch (err) {
    // Log to console so we can see the real error in browser devtools
    console.error('[API Error]', err?.response?.status, err?.response?.data || err?.message)
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
        initial={{ opacity: 0, y: 28, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.28 }}
        className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-medium backdrop-blur-md md:bottom-8"
        style={
          toast.type === 'error'
            ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5', boxShadow: '0 0 20px rgba(239,68,68,0.15)' }
            : toast.type === 'warning'
            ? { background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)', color: '#fde68a', boxShadow: '0 0 20px rgba(245,158,11,0.15)' }
            : { background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7', boxShadow: '0 0 20px rgba(16,185,129,0.15)' }
        }
      >
        {toast.message}
      </Motion.div>
    </AnimatePresence>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TaskSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 rounded-full bg-white/[0.07] animate-pulse mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/4 rounded-lg bg-white/[0.07] animate-pulse" />
          <div className="h-3 w-1/2 rounded-lg bg-white/[0.05] animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-white/[0.05] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Metrics bar ──────────────────────────────────────────────────────────────
function MetricsBar({ metrics, tasks }) {
  const overdueCnt = tasks.filter((t) => isOverdue(t)).length

  const stats = [
    { label: 'Total',     value: metrics?.totalTasks || 0,          color: 'text-white'         },
    { label: 'Completed', value: metrics?.completedTasks || 0,       color: 'text-emerald-300',  glow: '0 0 14px rgba(16,185,129,0.35)'  },
    { label: 'Completion',value: `${Math.round(metrics?.completedPercentage || 0)}%`, color: 'text-blue-300', glow: '0 0 14px rgba(59,130,246,0.4)' },
    { label: 'Overdue',   value: overdueCnt,                          color: overdueCnt ? 'text-red-300' : 'text-white/40', glow: overdueCnt ? '0 0 14px rgba(239,68,68,0.35)' : '' },
  ]

  return (
    <Motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-center backdrop-blur-md"
          style={{ boxShadow: s.glow || 'none' }}
        >
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="mt-0.5 text-[11px] text-white/40">{s.label}</p>
        </div>
      ))}
    </Motion.div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, count, color = 'text-white/60' }) {
  return (
    <div className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${color}`}>
      <Icon size={13} />
      {label}
      <span className="rounded-full bg-white/10 px-1.5 py-px text-[10px] font-bold text-white/50">
        {count}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function Tasks() {
  const [tasks,       setTasks]       = useState([])
  const [metrics,     setMetrics]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [selectedId,  setSelectedId]  = useState(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [deletingId,  setDeletingId]  = useState(null)
  const [togglingId,  setTogglingId]  = useState(null)
  const [filter,      setFilter]      = useState('all')
  const [toast,       setToast]       = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToast({ id, message, type })
    setTimeout(() => setToast(null), 3400)
  }, [])

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    // Fetch all tasks (no status filter) with a high limit so we get everything
    const { data, error: err } = await safeCall(() =>
      api.get('/api/tasks', { params: { limit: 200, sortBy: 'dueDate', sortOrder: 'asc' } }),
    )
    if (err) {
      setError(err)
    } else {
      setTasks(data?.tasks || [])
      setMetrics(data?.metrics || null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // ── Derived task lists ───────────────────────────────────────────────────
  const pendingTasks   = useMemo(() => tasks.filter((t) => t.status !== 'Completed'), [tasks])
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'Completed'), [tasks])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'pending':  return pendingTasks
      case 'high':     return pendingTasks.filter((t) => t.priority === 'High')
      case 'today':    return pendingTasks.filter((t) => isToday(t.dueDate))
      case 'overdue':  return pendingTasks.filter((t) => isOverdue(t))
      case 'done':     return completedTasks
      default:         return tasks
    }
  }, [tasks, filter, pendingTasks, completedTasks])

  // Separate pending vs done for display
  const displayPending   = useMemo(() => filtered.filter((t) => t.status !== 'Completed'), [filtered])
  const displayCompleted = useMemo(() => filtered.filter((t) => t.status === 'Completed'), [filtered])

  // Filter counts
  const counts = useMemo(() => ({
    all:     tasks.length,
    pending: pendingTasks.length,
    high:    pendingTasks.filter((t) => t.priority === 'High').length,
    today:   pendingTasks.filter((t) => isToday(t.dueDate)).length,
    overdue: pendingTasks.filter((t) => isOverdue(t)).length,
    done:    completedTasks.length,
  }), [tasks, pendingTasks, completedTasks])

  const selectedTask = useMemo(() => tasks.find((t) => t._id === selectedId) || null, [tasks, selectedId])

  // ── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    setSubmitting(true)
    const { data, error: err } = await safeCall(() => api.post('/api/tasks', formData))
    setSubmitting(false)
    if (err) { showToast(err, 'error'); return }
    setTasks((prev) => [data.task, ...prev])
    setModalOpen(false)
    showToast(`"${data.task.title}" added!`)
  }

  // ── Update ───────────────────────────────────────────────────────────────
  const handleUpdate = async (formData) => {
    if (!editTarget) return
    setSubmitting(true)
    const { data, error: err } = await safeCall(() =>
      api.put(`/api/tasks/${editTarget._id}`, formData),
    )
    setSubmitting(false)
    if (err) { showToast(err, 'error'); return }
    setTasks((prev) => prev.map((t) => (t._id === editTarget._id ? data.task : t)))
    if (selectedId === editTarget._id) setSelectedId(data.task._id)
    setEditTarget(null)
    setModalOpen(false)
    showToast('Task updated!')
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id)
    const { error: err } = await safeCall(() => api.delete(`/api/tasks/${id}`))
    setDeletingId(null)
    if (err) { showToast(err, 'error'); return }
    setTasks((prev) => prev.filter((t) => t._id !== id))
    if (selectedId === id) setSelectedId(null)
    showToast('Task removed.')
  }

  // ── Toggle complete ───────────────────────────────────────────────────────
  const handleToggle = async (task) => {
    setTogglingId(task._id)
    const isDone = task.status === 'Completed'

    const { data, error: err } = await safeCall(() =>
      isDone
        ? api.put(`/api/tasks/${task._id}`, { status: 'Pending' })
        : api.patch(`/api/tasks/${task._id}/complete`),
    )
    setTogglingId(null)
    if (err || !data?.task) { showToast(err || 'Toggle failed', 'error'); return }
    setTasks((prev) => prev.map((t) => (t._id === task._id ? data.task : t)))
    if (!isDone) {
      showToast(`"${task.title}" completed! 🎉`)
    } else {
      showToast(`"${task.title}" re-opened.`, 'warning')
    }

    // Update metrics locally for immediate feedback
    setMetrics((prev) => {
      if (!prev) return prev
      const delta = isDone ? -1 : 1
      const completedTasks = (prev.completedTasks || 0) + delta
      const totalTasks = prev.totalTasks || 1
      return {
        ...prev,
        completedTasks,
        completedPercentage: Math.round((completedTasks / totalTasks) * 100 * 100) / 100,
      }
    })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (task) => { setEditTarget(task); setModalOpen(true) }

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
          <Motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-purple-400/70">
                <Sparkles size={11} />
                Mission Control
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-almond">
                Task{' '}
                <span
                  className="text-purple-400"
                  style={{ textShadow: '0 0 20px rgba(139,92,246,0.6)' }}
                >
                  Manager
                </span>
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Organise, prioritise, and conquer every goal
              </p>
            </div>

            <Motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(59,130,246,0.85))',
                boxShadow: '0 0 28px rgba(139,92,246,0.4), 0 0 50px rgba(59,130,246,0.2)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <Plus size={16} />
              Add Task
            </Motion.button>
          </Motion.div>

          {/* ── Metrics ── */}
          {!loading && !error && <MetricsBar metrics={metrics} tasks={tasks} />}

          {/* ── Filters ── */}
          {!loading && !error && (
            <Motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <TaskFilters active={filter} onChange={setFilter} counts={counts} />
            </Motion.div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Failed to load tasks</p>
                <p className="mt-0.5 opacity-80">{error}</p>
                <button onClick={fetchTasks} className="mt-2 rounded-lg border border-red-400/30 px-3 py-1 text-xs hover:bg-red-500/15 transition">
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* ── Two-column layout ── */}
          {!error && (
            <div className={`flex gap-5 ${selectedTask ? 'flex-col lg:flex-row' : ''}`}>

              {/* LEFT: Task lists */}
              <div className={`flex-1 min-w-0 space-y-6 ${selectedTask ? 'lg:max-w-[55%]' : ''}`}>

                {/* Loading */}
                {loading && (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <TaskSkeleton key={i} />)}
                  </div>
                )}

                {/* Empty state */}
                {!loading && tasks.length === 0 && (
                  <Motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-20 text-center"
                  >
                    <div
                      className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ background: 'rgba(139,92,246,0.1)', boxShadow: '0 0 24px rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.2)' }}
                    >
                      <ClipboardList size={24} className="text-purple-400" />
                    </div>
                    <h3 className="text-base font-semibold text-almond">No tasks yet</h3>
                    <p className="mt-1 max-w-xs text-sm text-white/40">
                      Add your first task and start tracking your interview preparation.
                    </p>
                    <Motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={openAdd}
                      className="mt-5 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(59,130,246,0.8))', boxShadow: '0 0 18px rgba(139,92,246,0.3)' }}
                    >
                      <Plus size={15} />
                      Add First Task
                    </Motion.button>
                  </Motion.div>
                )}

                {/* No match */}
                {!loading && tasks.length > 0 && filtered.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-white/35">
                    No tasks match this filter.{' '}
                    <button onClick={() => setFilter('all')} className="text-blue-400 underline hover:text-blue-300">
                      Clear filter
                    </button>
                  </div>
                )}

                {/* Pending tasks */}
                {!loading && displayPending.length > 0 && (
                  <div>
                    <SectionHeader icon={ListTodo} label="Pending" count={displayPending.length} color="text-almond/60" />
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {displayPending.map((task, i) => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            index={i}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onToggle={handleToggle}
                            onSelect={setSelectedId}
                            selected={selectedId}
                            deleting={deletingId}
                            toggling={togglingId}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Completed tasks */}
                {!loading && displayCompleted.length > 0 && (
                  <div>
                    <SectionHeader icon={CheckSquare} label="Completed" count={displayCompleted.length} color="text-emerald-400/60" />
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {displayCompleted.map((task, i) => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            index={i}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onToggle={handleToggle}
                            onSelect={setSelectedId}
                            selected={selectedId}
                            deleting={deletingId}
                            toggling={togglingId}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Detail panel */}
              <AnimatePresence mode="wait">
                {selectedTask && (
                  <div className="w-full lg:w-[42%] lg:shrink-0">
                    <TaskDetailPanel
                      key={selectedTask._id}
                      task={selectedTask}
                      onEdit={openEdit}
                      onDelete={(id) => { handleDelete(id); setSelectedId(null) }}
                      onToggle={handleToggle}
                      onClose={() => setSelectedId(null)}
                      deleting={deletingId}
                      toggling={togglingId}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </Motion.main>

      {/* ── Modal ── */}
      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSubmit={editTarget ? handleUpdate : handleCreate}
        initialData={editTarget}
        loading={submitting}
      />

      {/* ── Toast ── */}
      <Toast toast={toast} />
    </div>
  )
}

export default Tasks
