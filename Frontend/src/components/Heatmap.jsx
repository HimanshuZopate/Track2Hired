function getLevel(count, maxCount) {
  if (!count) return 'bg-[#18181C]'
  const ratio = maxCount > 0 ? count / maxCount : 0
  if (ratio < 0.34) return 'bg-blue-500/70'
  if (ratio < 0.67) return 'bg-purple-500/75'
  return 'bg-emerald-500/80'
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

  return (
    <div className="overflow-x-auto scrollbar-neon">
      <div className="grid min-w-[760px] grid-flow-col grid-rows-4 gap-2">
        {data.map((day) => (
          <div
            key={day.date}
            title={`${day.date} • ${day.count} activities`}
            className={`h-7 w-7 rounded-md border border-white/5 ${getLevel(day.count, maxCount)} transition-all hover:scale-110`}
          />
        ))}
      </div>
    </div>
  )
}

export default Heatmap
