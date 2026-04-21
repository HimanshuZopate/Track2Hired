import { motion as Motion } from 'framer-motion'
import { AlertTriangle, Calendar, CheckCircle2, Circle, Clock, Pencil, Trash2 } from 'lucide-react'
import PriorityBadge from './PriorityBadge'

// ─── helpers ─────────────────────────────────────────────────────────────────
const isToday = (dateStr) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'Completed') return false
  return new Date(task.dueDate) < new Date()
}

const formatDate = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ─── Card variants ────────────────────────────────────────────────────────────
const cardVariants = {
  hidden:  { opacity: 0, x: -20, scale: 0.97 },
  visible: { opacity: 1,  x: 0,  scale: 1 },
  exit:    { opacity: 0,  x: 20, scale: 0.94, transition: { duration: 0.22 } },
}

function TaskCard({ task, index = 0, onEdit, onDelete, onToggle, onSelect, selected, deleting, toggling }) {
  const done      = task.status === 'Completed'
  const overdue   = isOverdue(task)
  const today     = isToday(task.dueDate)
  const isSelected = selected === task._id

  // Border colour logic
  let borderClass = 'border-white/[0.08]'
  if (done)    borderClass = 'border-emerald-400/20'
  else if (overdue) borderClass = 'border-red-400/30'
  else if (today)   borderClass = 'border-blue-400/25'

  return (
    <Motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.32, delay: index * 0.04, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => onSelect(task._id === selected ? null : task._id)}
      className={`group relative cursor-pointer rounded-2xl border p-4 backdrop-blur-md transition-all ${borderClass} ${
        isSelected
          ? 'bg-blue-500/10 shadow-neonBlue'
          : 'bg-white/[0.04] hover:bg-white/[0.07]'
      } ${done ? 'opacity-60' : ''}`}
      style={{
        boxShadow: isSelected
          ? '0 0 0 1px rgba(59,130,246,0.35), 0 4px 20px rgba(59,130,246,0.15)'
          : overdue && !done
          ? '0 0 0 1px rgba(239,68,68,0.2), 0 2px 12px rgba(239,68,68,0.08)'
          : '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      {/* Overdue banner */}
      {overdue && !done && (
        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-red-400">
          <AlertTriangle size={11} />
          Overdue
        </div>
      )}

      {/* Today flag */}
      {today && !done && !overdue && (
        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-cyan-400">
          <Clock size={11} />
          Due Today
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task) }}
          disabled={toggling === task._id}
          className="mt-0.5 shrink-0 text-white/40 hover:text-emerald-400 transition-colors"
          title={done ? 'Mark as pending' : 'Mark as completed'}
        >
          <Motion.div
            animate={done ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {toggling === task._id ? (
              <span className="block h-4 w-4 animate-spin rounded-full border border-white/30 border-t-transparent" />
            ) : done ? (
              <CheckCircle2 size={18} className="text-emerald-400" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.6))' }} />
            ) : (
              <Circle size={18} />
            )}
          </Motion.div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium leading-snug ${
              done ? 'line-through text-white/35' : 'text-almond'
            }`}
          >
            {task.title}
          </p>

          {task.description && (
            <p className="mt-1 truncate text-[11px] text-white/40 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />

            {task.dueDate && (
              <span className={`flex items-center gap-1 text-[11px] ${overdue && !done ? 'text-red-400' : 'text-white/40'}`}>
                <Calendar size={10} />
                {formatDate(task.dueDate)}
                {formatTime(task.dueDate) !== '12:00 AM' && (
                  <span className="ml-0.5 opacity-70">{formatTime(task.dueDate)}</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Actions (visible on hover) */}
        <div
          className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(task)}
            title="Edit task"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-400 transition-colors hover:bg-blue-500/25"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            disabled={deleting === task._id}
            title="Delete task"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {deleting === task._id ? (
              <span className="h-2.5 w-2.5 animate-spin rounded-full border border-red-400 border-t-transparent" />
            ) : (
              <Trash2 size={11} />
            )}
          </button>
        </div>
      </div>
    </Motion.div>
  )
}

export default TaskCard
export { isOverdue, isToday, formatDate, formatTime }
