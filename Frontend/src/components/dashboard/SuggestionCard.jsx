import { motion as Motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'

function SuggestionCard({ suggestion = '', loading = false }) {
  return (
    <Motion.div whileHover={{ y: -4, boxShadow: '0 0 36px rgba(245,158,11,0.22)' }} className="action-block amber">
      <div className="action-title-row">
        <div className="action-icon amber">
          <Lightbulb size={16} />
        </div>
        <h4>Daily Suggestion</h4>
      </div>
      {loading ? (
        <div className="mission-skeleton h-16" />
      ) : (
        <p className="suggestion-text">{suggestion || 'No suggestion available right now. Keep your routine active.'}</p>
      )}
    </Motion.div>
  )
}

export default SuggestionCard
