const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'high',     label: 'High Priority' },
  { key: 'today',    label: 'Due Today' },
  { key: 'overdue',  label: 'Overdue' },
  { key: 'done',     label: 'Completed' },
]

const ACTIVE_STYLES = {
  all:      'bg-white/10 text-white border-white/20',
  pending:  'bg-blue-500/20 text-blue-300 border-blue-400/30',
  high:     'bg-red-500/20 text-red-300 border-red-400/30',
  today:    'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
  overdue:  'bg-red-600/25 text-red-300 border-red-500/35',
  done:     'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
}

function TaskFilters({ active, onChange, counts = {} }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? ACTIVE_STYLES[key] || 'bg-white/10 text-white border-white/20'
                : 'border-transparent text-white/45 hover:border-white/10 hover:text-white/75'
            }`}
          >
            {label}
            {counts[key] !== undefined && (
              <span
                className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${
                  isActive ? 'bg-white/20' : 'bg-white/08 text-white/35'
                }`}
              >
                {counts[key]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default TaskFilters
