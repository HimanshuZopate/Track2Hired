const CONFIG = {
  High: {
    label: 'High',
    bg: 'bg-red-500/15',
    border: 'border-red-400/35',
    text: 'text-red-300',
    dot: 'bg-red-400',
    glow: '0 0 10px rgba(239,68,68,0.4)',
  },
  Medium: {
    label: 'Medium',
    bg: 'bg-amber-500/15',
    border: 'border-amber-400/35',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    glow: '0 0 10px rgba(245,158,11,0.35)',
  },
  Low: {
    label: 'Low',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-400/35',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    glow: '0 0 10px rgba(16,185,129,0.35)',
  },
}

function PriorityBadge({ priority = 'Medium', size = 'sm' }) {
  const c = CONFIG[priority] || CONFIG.Medium
  const px = size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${c.bg} ${c.border} ${c.text} ${px}`}
      style={{ boxShadow: c.glow }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

export default PriorityBadge
export { CONFIG as PRIORITY_CONFIG }
