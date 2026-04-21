import { motion as Motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Pencil,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import PriorityBadge from './PriorityBadge'
import { formatDate, formatTime, isOverdue, isToday } from './TaskCard'

const STATUS_STYLES = {
  Pending:     { text: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-400/25' },
  'In Progress': { text: 'text-blue-300', bg: 'bg-blue-500/10',   border: 'border-blue-400/25'  },
  Completed:   { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-400/25' },
}

function TaskDetailPanel({ task, onEdit, onDelete, onToggle, onClose, deleting, toggling }) {
  if (!task) return null

  const done    = task.status === 'Completed'
  const overdue = isOverdue(task)
  const today   = isToday(task.dueDate)
  const ss      = STATUS_STYLES[task.status] || STATUS_STYLES.Pending

  return (
    <Motion.div
      key={task._id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="sticky top-4 flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-[#14151a]/80 backdrop-blur-xl overflow-hidden"
      style={{
        boxShadow: overdue && !done
          ? '0 0 0 1px rgba(239,68,68,0.2), 0 8px 40px rgba(0,0,0,0.4)'
          : '0 0 0 1px rgba(59,130,246,0.12), 0 8px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Ambient orb */}
      <div
        className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/35 mb-1">
            Task Detail
          </p>
          <h3
            className={`text-base font-semibold leading-snug ${
              done ? 'line-through text-white/35' : 'text-almond'
            }`}
          >
            {task.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/35 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 p-5 overflow-y-auto scrollbar-neon">

        {/* Overdue / Today alert */}
        {overdue && !done && (
          <div className="flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">
            <AlertTriangle size={13} />
            This task is overdue
          </div>
        )}
        {today && !done && !overdue && (
          <div className="flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300">
            <Clock size={13} />
            Due today – push to finish!
          </div>
        )}
        {done && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
            <CheckCircle2 size={13} />
            Completed
            {task.completedAt && ` · ${formatDate(task.completedAt)}`}
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/35">
              <FileText size={11} />
              Description
            </div>
            <p className="text-sm leading-relaxed text-white/70">{task.description}</p>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/30">
              <Tag size={9} />
              Priority
            </div>
            <PriorityBadge priority={task.priority} size="lg" />
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/30">
              <Circle size={9} />
              Status
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ss.bg} ${ss.border} ${ss.text}`}
            >
              {task.status}
            </span>
          </div>

          {task.dueDate && (
            <div className="col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/30">
                <Calendar size={9} />
                Due Date
              </div>
              <p className={`text-sm font-medium ${overdue && !done ? 'text-red-300' : 'text-almond'}`}>
                {formatDate(task.dueDate)}
                {formatTime(task.dueDate) && (
                  <span className="ml-2 text-xs opacity-60">{formatTime(task.dueDate)}</span>
                )}
              </p>
            </div>
          )}

          <div className="col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-white/30">Created</div>
            <p className="text-xs text-white/50">{formatDate(task.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 border-t border-white/[0.07] p-4">
        {/* Toggle complete */}
        <Motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onToggle(task)}
          disabled={toggling === task._id}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
            done
              ? 'border-amber-400/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          {toggling === task._id ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
          ) : done ? (
            <><Circle size={13} /> Re-open</>
          ) : (
            <><CheckCircle2 size={13} /> Complete</>
          )}
        </Motion.button>

        <button
          onClick={() => onEdit(task)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-400 transition-colors hover:bg-blue-500/20"
        >
          <Pencil size={14} />
        </button>

        <button
          onClick={() => onDelete(task._id)}
          disabled={deleting === task._id}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          {deleting === task._id ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-red-400 border-t-transparent" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>
    </Motion.div>
  )
}

export default TaskDetailPanel
