import { motion as Motion } from 'framer-motion'
import { Brain, PlayCircle, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import TaskList from './TaskList'
import SuggestionCard from './SuggestionCard'

function ActionCenter({ tasks = [], suggestion = '', loading = false }) {
  return (
    <Motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="mission-panel action-center"
    >
      <div className="panel-title-row">
        <h3>Action Center</h3>
      </div>

      <Motion.div whileHover={{ y: -5, boxShadow: '0 0 36px rgba(59,130,246,0.24)' }} className="action-block blue">
        <div className="action-title-row">
          <div className="action-icon blue">
            <Sparkles size={16} />
          </div>
          <h4>Pending Tasks</h4>
        </div>
        <TaskList tasks={tasks} loading={loading} />
      </Motion.div>

      <Motion.div whileHover={{ y: -5, boxShadow: '0 0 36px rgba(139,92,246,0.24)' }} className="action-block purple">
        <div className="action-title-row">
          <div className="action-icon purple">
            <Brain size={16} />
          </div>
          <h4>AI Practice Quick Launch</h4>
        </div>
        <p className="action-desc">Jump into a focused practice sprint and keep your momentum active.</p>
        <div className="action-cta-row">
          <Link to="/ai-practice" className="mission-btn primary">
            <PlayCircle size={14} /> Start Practice
          </Link>
          <Link to="/tasks" className="mission-btn ghost">
            View Tasks
          </Link>
        </div>
      </Motion.div>

      <SuggestionCard suggestion={suggestion} loading={loading} />
    </Motion.section>
  )
}

export default ActionCenter
