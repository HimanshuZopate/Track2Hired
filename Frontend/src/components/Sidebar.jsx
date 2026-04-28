import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  BarChart3,
  Brain,
  CheckSquare,
  Flame,
  Gauge,
  Home,
  LogOut,
  Menu,
  ShieldUser,
  Sparkles,
  Target,
  UserRoundSearch,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../services/api'

const navItems = [
  { label: 'Dashboard',  to: '/dashboard',   icon: Home           },
  { label: 'Skills',     to: '/skills',      icon: Gauge          },
  { label: 'Tasks',      to: '/tasks',       icon: CheckSquare    },
  { label: 'AI Practice',to: '/ai-practice', icon: Brain          },
  { label: 'Resume',     to: '/resume',      icon: ShieldUser     },
  { label: 'Analytics',  to: '/analytics',   icon: BarChart3      },
  { label: 'Streak',     to: '/streak',      icon: Flame          },
  { label: 'Recruiter',  to: '/recruiter',   icon: UserRoundSearch, recruiterOnly: true },
]

// ─── Shared logout handler ────────────────────────────────────────────────────
function useLogout() {
  const navigate = useNavigate()
  return () => {
    clearAuthToken()
    navigate('/login', { replace: true })
  }
}

// ─── Logout button (reused in desktop + mobile) ───────────────────────────────
function LogoutButton({ onClick, compact = false }) {
  return (
    <Motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`flex w-full items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-sm font-medium text-red-400 transition-all hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-300 ${compact ? 'justify-center' : ''}`}
    >
      <LogOut size={16} className="shrink-0" />
      {!compact && <span>Logout</span>}
    </Motion.button>
  )
}

// ─── Desktop nav link ─────────────────────────────────────────────────────────
function NavLink({ item, isActive }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
        isActive
          ? 'border border-blue-400/50 bg-white/10 text-white shadow-neonBlue'
          : 'text-white/70 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={18} />
      {item.label}
    </Link>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
function Sidebar({ role = 'student' }) {
  const location = useLocation()
  const [open, setOpen]   = useState(false)
  const logout            = useLogout()

  const isRouteActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`)

  const filteredItems = useMemo(
    () => navItems.filter((item) => !(item.recruiterOnly && role !== 'recruiter')),
    [role],
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col border-r border-white/10 bg-[#0e0f14]/80 backdrop-blur-xl">
        {/* Logo */}
        <Link to="/dashboard" className="block px-6 py-8">
          <div className="text-3xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-almond drop-shadow-[0_0_10px_rgba(110,231,183,0.3)]">Track</span>
            <span className="text-blue-500 inline-block transform hover:scale-110 hover:rotate-12 transition-transform duration-300 mx-[2px] drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]">2</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-purple-400 to-almond drop-shadow-[0_0_10px_rgba(192,132,252,0.3)]">Hired</span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4">
          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              isActive={isRouteActive(item.to)}
            />
          ))}
        </nav>

        {/* Logout footer */}
        <div className="border-t border-white/[0.07] px-4 py-4">
          <LogoutButton onClick={logout} />
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#111218]/90 backdrop-blur-xl">
        <div className="grid grid-cols-5 px-2 py-2">
          {filteredItems.slice(0, 4).map((item) => {
            const Icon     = item.icon
            const isActive = isRouteActive(item.to)
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
          {/* More button opens drawer */}
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

      {/* ── Mobile slide-in drawer ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <Motion.div
              className="md:hidden fixed inset-0 z-40 bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Drawer panel */}
            <Motion.aside
              className="md:hidden fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#111218] p-4"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            >
              {/* Drawer header */}
              <div className="mb-6 flex items-center justify-between">
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block">
                  <div className="text-2xl font-extrabold tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-almond drop-shadow-[0_0_10px_rgba(110,231,183,0.3)]">Track</span>
                    <span className="text-blue-500 inline-block transform hover:scale-110 hover:rotate-12 transition-transform duration-300 mx-[2px] drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]">2</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-l from-purple-400 to-almond drop-shadow-[0_0_10px_rgba(192,132,252,0.3)]">Hired</span>
                  </div>
                </Link>
                <button type="button" onClick={() => setOpen(false)}>
                  <X className="text-white/80" size={18} />
                </button>
              </div>

              {/* Drawer nav links */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {filteredItems.map((item) => {
                  const Icon     = item.icon
                  const isActive = isRouteActive(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                        isActive
                          ? 'border border-blue-400/50 bg-white/10 text-white shadow-neonBlue'
                          : 'text-white/75 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={17} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>

              {/* Motivational tag */}
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-200">
                <Sparkles size={14} />
                Keep consistency, your streak matters.
              </div>

              {/* Drawer logout */}
              <div className="mt-3">
                <LogoutButton
                  onClick={() => { setOpen(false); logout() }}
                />
              </div>
            </Motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
