import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  BarChart3,
  Brain,
  CheckSquare,
  Flame,
  Gauge,
  Home,
  Menu,
  ShieldUser,
  Sparkles,
  UserRoundSearch,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: Home },
  { label: 'Skills', to: '/skills', icon: Gauge },
  { label: 'Tasks', to: '/tasks', icon: CheckSquare },
  { label: 'AI Practice', to: '/ai-practice', icon: Brain },
  { label: 'Resume', to: '/resume', icon: ShieldUser },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Streak', to: '/streak', icon: Flame },
  { label: 'Recruiter', to: '/recruiter', icon: UserRoundSearch, recruiterOnly: true },
]

function Sidebar({ role = 'student' }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const filteredItems = useMemo(
    () => navItems.filter((item) => !(item.recruiterOnly && role !== 'recruiter')),
    [role],
  )

  return (
    <>
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col border-r border-white/10 bg-[#0e0f14]/80 backdrop-blur-xl">
        <div className="px-6 py-8 text-3xl font-bold tracking-wide text-almond">
          TRACK<span className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,.75)]">2</span>HIRED
        </div>
        <nav className="flex-1 space-y-2 px-4">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.to
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white bg-white/10 shadow-neonBlue border border-blue-400/50'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#111218]/90 backdrop-blur-xl">
        <div className="grid grid-cols-5 px-2 py-2">
          {filteredItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] ${
                  isActive ? 'text-blue-300' : 'text-white/65'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-white/75"
            onClick={() => setOpen(true)}
          >
            <Menu size={16} />
            More
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <Motion.div
              className="md:hidden fixed inset-0 z-40 bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <Motion.aside
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#111218] p-4"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="text-xl font-bold text-almond">
                  TRACK<span className="text-blue-400">2</span>HIRED
                </div>
                <button type="button" onClick={() => setOpen(false)}>
                  <X className="text-white/80" size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.to
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                        isActive
                          ? 'text-white bg-white/10 border border-blue-400/50 shadow-neonBlue'
                          : 'text-white/75 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={17} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-200">
                <Sparkles size={14} />
                Keep consistency, your streak matters.
              </div>
            </Motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
