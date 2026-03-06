import { ArrowRight, Bot } from 'lucide-react'
import DashboardCard from './DashboardCard'

function SuggestionCard({ suggestion, loading = false, error = '' }) {
  return (
    <DashboardCard glow="amber" className="relative overflow-hidden">
      <div className="absolute inset-x-8 bottom-0 h-[1px] bg-gradient-to-r from-blue-400/60 via-purple-400/60 to-amber-300/60" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-cyan-300/40 bg-cyan-500/10 p-2 text-cyan-200">
            <Bot size={22} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-[#ffb2b2]">AI Career Tip</p>
            {loading ? (
              <div className="mt-2 h-5 w-72 max-w-full animate-pulse rounded bg-white/10" />
            ) : error ? (
              <p className="mt-1 text-sm text-red-300">{error}</p>
            ) : (
              <p className="mt-1 text-base text-white/85">{suggestion || 'No suggestion available for today.'}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-purple-400/50 bg-gradient-to-r from-purple-500/50 to-pink-500/50 px-4 py-2 text-sm font-medium text-white transition hover:shadow-neonPurple"
        >
          Get More Advice
          <ArrowRight size={16} />
        </button>
      </div>
    </DashboardCard>
  )
}

export default SuggestionCard
