import { motion as Motion } from 'framer-motion'
import { Activity, Milestone } from 'lucide-react'
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
          <p className="block-title">Skill Radar</p>
          <RadarChart data={radarData} loading={loading} />
        </div>

        <div className="progress-block">
          <p className="block-title">Weekly Consistency</p>
          <ConsistencyGraph data={consistencyData} loading={loading} />
        </div>

        <div className="progress-block timeline">
          <p className="block-title">Achievement Timeline</p>
          {loading ? (
            <div className="mission-skeleton h-[180px]" />
          ) : timeline.length ? (
            <ul className="timeline-list">
              {timeline.slice(0, 6).map((item, idx) => (
                <li key={`${item.date}-${item.type}-${idx}`}>
                  <span className="timeline-icon">{item.type === 'TaskComplete' ? <Milestone size={13} /> : <Activity size={13} />}</span>
                  <div>
                    <p>{item.label}</p>
                    <small>{item.date}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mission-empty h-[180px]">No milestones yet. Start by completing one task today.</div>
          )}
        </div>
      </div>
    </Motion.section>
  )
}

export default ProgressPanel
