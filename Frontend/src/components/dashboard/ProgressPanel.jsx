import { motion as Motion } from 'framer-motion'
import { CheckCircle2, Brain, TrendingUp } from 'lucide-react'
import ConsistencyGraph from './ConsistencyGraph'
import RadarChart from './RadarChart'

function ProgressPanel({ radarData = [], consistencyData = [], timeline = [], loading = false }) {
  return (
    <Motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mission-panel progress"
    >
      <div className="panel-title-row">
        <h3>Progress Intelligence</h3>
      </div>

      <div className="progress-grid">
        <div className="progress-block">
          <p className="block-title mb-1">Skill Radar</p>
          <p className="text-xs text-white/40 mb-4 leading-relaxed">Visual spread of your core technical skills based on recent AI practice scores.</p>
          <RadarChart data={radarData} loading={loading} />
        </div>

        <div className="progress-block">
          <p className="block-title mb-1">Weekly Consistency</p>
          <p className="text-xs text-white/40 mb-4 leading-relaxed">Your daily momentum score derived from task completions and practice sessions.</p>
          <ConsistencyGraph data={consistencyData} loading={loading} />
        </div>

        <div className="progress-block timeline">
          <p className="block-title mb-4">Achievement Timeline</p>
          {loading ? (
            <div className="mission-skeleton h-[180px]" />
          ) : timeline.length ? (
            <div className="relative space-y-4 pl-1 before:absolute before:inset-y-2 before:left-[17px] before:w-[2px] before:bg-gradient-to-b before:from-purple-500/50 before:via-blue-500/30 before:to-transparent">
              {timeline.slice(0, 5).map((item, idx) => {
                const isTask = item.type.includes('task') || item.type === 'TaskComplete';
                const isPractice = item.type.includes('question') || item.type === 'QuestionAttempt' || item.type === 'AIPractice';
                
                const Icon = isTask ? CheckCircle2 : isPractice ? Brain : TrendingUp;
                const iconColor = isTask ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' : isPractice ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]' : 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]';
                const bgColor = isTask ? 'bg-emerald-500/10 border-emerald-500/20' : isPractice ? 'bg-purple-500/10 border-purple-500/20' : 'bg-blue-500/10 border-blue-500/20';

                return (
                  <Motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={`${item.date}-${item.type}-${idx}`}
                    className="relative flex items-start gap-4 group cursor-default"
                  >
                    <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${bgColor} backdrop-blur-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={14} className={iconColor} />
                    </div>
                    <div className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5 transition-all duration-300 group-hover:bg-white/[0.06] group-hover:border-white/[0.1] group-hover:translate-x-1">
                      <p className="text-sm font-semibold text-almond/90">{item.label}</p>
                      <small className="mt-1 block text-xs font-medium text-white/40">{item.date}</small>
                    </div>
                  </Motion.div>
                )
              })}
            </div>
          ) : (
            <div className="mission-empty h-[180px]">No milestones yet. Start by completing one task today.</div>
          )}
        </div>
      </div>
    </Motion.section>
  )
}

export default ProgressPanel
