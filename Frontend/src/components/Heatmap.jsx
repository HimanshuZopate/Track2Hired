import { motion as Motion } from 'framer-motion'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getLevel(count, maxCount, providedLevel) {
  if (!count) return 'bg-[#18181C] border-white/5'
  if (providedLevel === 1) return 'bg-blue-500/75 border-blue-300/25'
  if (providedLevel === 2) return 'bg-purple-500/80 border-purple-300/25'
  if (providedLevel === 3) return 'bg-emerald-500/85 border-emerald-300/25'

  const ratio = maxCount > 0 ? count / maxCount : 0
  if (ratio < 0.34) return 'bg-blue-500/75 border-blue-300/25'
  if (ratio < 0.67) return 'bg-purple-500/80 border-purple-300/25'
  return 'bg-emerald-500/85 border-emerald-300/25'
}

function buildWeeks(data) {
  if (!data.length) return []

  const firstDate = new Date(`${data[0].date}T00:00:00.000Z`)
  const padStart = firstDate.getUTCDay()
  const padded = [...Array.from({ length: padStart }, () => null), ...data]

  while (padded.length % 7 !== 0) {
    padded.push(null)
  }

  const weeks = []

  for (let index = 0; index < padded.length; index += 7) {
    weeks.push(padded.slice(index, index + 7))
  }

  return weeks
}

function Heatmap({ data = [], loading = false }) {
  if (loading) {
    return <div className="h-40 w-full animate-pulse rounded-xl bg-white/5" />
  }

  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-white/10 text-sm text-white/60">
        No activity history available yet.
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 0)
  const weeks = buildWeeks(data)

  return (
    <div className="space-y-4 overflow-x-auto scrollbar-neon">
      <div className="flex min-w-[760px] gap-3">
        <div className="grid grid-rows-7 gap-2 pt-1">
          {DAY_LABELS.map((label) => (
            <div key={label} className="flex h-4 items-center text-[10px] uppercase tracking-[0.2em] text-white/30">
              {label[0]}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-2">
              {week.map((day, dayIndex) =>
                day ? (
                  <Motion.div
                    key={day.date}
                    title={`${day.date} • ${day.count} activities`}
                    whileHover={{ scale: 1.15, y: -2 }}
                    className={`heatmap-cell h-4 w-4 rounded-[4px] border transition-all ${getLevel(day.count, maxCount, day.level)}`}
                  />
                ) : (
                  <div key={`empty-${weekIndex}-${dayIndex}`} className="h-4 w-4 rounded-[4px] bg-transparent" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
        <div className="flex items-center gap-2">
          <span>Less</span>
          {[
            'bg-[#18181C] border-white/5',
            'bg-blue-500/75 border-blue-300/25',
            'bg-purple-500/80 border-purple-300/25',
            'bg-emerald-500/85 border-emerald-300/25',
          ].map((className) => (
            <span key={className} className={`h-3.5 w-3.5 rounded-[4px] border ${className}`} />
          ))}
          <span>More</span>
        </div>
        <div>{data.length} days tracked</div>
      </div>
    </div>
  )
}

export default Heatmap
