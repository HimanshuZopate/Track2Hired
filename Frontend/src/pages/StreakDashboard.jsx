import { motion as Motion } from 'framer-motion'
import {
  AlertTriangle,
  Award,
  BellRing,
  CalendarRange,
  Flame,
  Lightbulb,
  Medal,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AnimatedCounter from '../components/AnimatedCounter'
import DashboardCard from '../components/DashboardCard'
import Heatmap from '../components/Heatmap'
import Sidebar from '../components/Sidebar'
import { dashboardApi, getAuthToken } from '../services/api'

const safeCall = async (request) => {
  try {
    const response = await request()
    return { data: response.data, error: '' }
  } catch (error) {
    return { data: null, error: error?.response?.data?.message || 'Request failed' }
  }
}

const medalColors = {
  1: 'text-amber-300',
  2: 'text-slate-200',
  3: 'text-orange-300',
}

const formatDate = (value) => {
  if (!value) return 'No activity yet'

  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function StatTile({ icon: Icon, label, value, suffix = '', subtext = '', glow = 'blue', loading = false }) {
  if (loading) {
    return <div className="h-36 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
  }

  return (
    <DashboardCard glow={glow} className="h-full">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">{label}</p>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80">
            <Icon size={18} />
          </div>
        </div>
        <div>
          <p className="streak-counter-glow text-4xl font-bold text-almond tabular-nums tracking-tight">
            <AnimatedCounter value={value} className="inline-block" />
            <span className="ml-1 text-lg font-medium text-white/55 tracking-normal">{suffix}</span>
          </p>
          {subtext ? <p className="mt-2 text-sm text-white/55">{subtext}</p> : null}
        </div>
      </div>
    </DashboardCard>
  )
}

function BadgeStrip({ badges = [], activeBadge = null, currentBadge = null, loading = false }) {
  if (loading) {
    return <div className="h-full rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
  }

  return (
    <DashboardCard glow="amber" className="h-full">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Badge Vault</p>
            <h3 className="mt-2 text-2xl font-semibold text-almond">
              {activeBadge || currentBadge || 'No badge yet'}
            </h3>
            <p className="mt-1 text-sm text-white/55">Unlock badges by maintaining daily momentum.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-amber-300">
            <Award size={20} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {badges.map((badge, index) => (
            <Motion.div
              key={badge.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`badge-chip rounded-2xl border px-3 py-3 text-center ${
                badge.unlocked
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/10 bg-white/5 text-white/45'
              } ${badge.active ? 'ring-1 ring-amber-400/50' : ''}`}
            >
              <p className="text-lg">{badge.icon}</p>
              <p className="mt-1 text-sm font-semibold">{badge.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/45">{badge.threshold} days</p>
            </Motion.div>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}

function LeaderboardPanel({ leaderboard = [], loading = false }) {
  return (
    <DashboardCard glow="purple" className="h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Leaderboard</p>
          <h3 className="mt-2 text-xl font-semibold text-almond">Top streak champions</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-purple-300">
          <Trophy size={18} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          ))
        ) : leaderboard.length ? (
          leaderboard.map((entry) => (
            <Motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-bold ${medalColors[entry.rank] || 'text-white/70'}`}>
                {entry.rank <= 3 ? <Medal size={16} /> : entry.rank}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-almond">{entry.name}</p>
                <p className="mt-1 text-xs text-white/45">
                  {entry.totalActivity} activities • {entry.badge || 'Starter'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-300">{entry.currentStreak}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">days</p>
              </div>
            </Motion.div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/45">
            No leaderboard activity yet.
          </div>
        )}
      </div>
    </DashboardCard>
  )
}

function SuggestionsPanel({ suggestions = [], loading = false }) {
  return (
    <DashboardCard glow="emerald" className="h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Smart Suggestions</p>
          <h3 className="mt-2 text-xl font-semibold text-almond">What to do next</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
          <Lightbulb size={18} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          ))
        ) : suggestions.length ? (
          suggestions.map((suggestion, index) => (
            <Motion.div
              key={suggestion.id || index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/45">
                  {suggestion.type}
                </span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-300">{suggestion.priority}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/80">{suggestion.message}</p>
              {suggestion.cta ? (
                <Link
                  to={suggestion.cta}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:bg-emerald-500/15"
                >
                  Start now
                </Link>
              ) : null}
            </Motion.div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/45">
            Suggestions will appear as soon as the engine detects patterns.
          </div>
        )}
      </div>
    </DashboardCard>
  )
}

function NotificationsPanel({ notifications = [], unreadCount = 0, loading = false }) {
  return (
    <DashboardCard glow="blue" className="h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Notifications</p>
          <h3 className="mt-2 text-xl font-semibold text-almond">Streak alerts</h3>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-blue-200">
          <BellRing size={16} />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">{unreadCount} unread</span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          ))
        ) : notifications.length ? (
          notifications.map((notification, index) => (
            <Motion.div
              key={notification._id || index}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-almond">{notification.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/35">
                    {notification.type?.replace('_', ' ')}
                  </p>
                </div>
                {!notification.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.8)]" /> : null}
              </div>
              <p className="mt-3 text-xs text-white/45">{formatDate(notification.createdAt)}</p>
            </Motion.div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/45">
            No notifications yet. Keep your streak alive to trigger milestone alerts.
          </div>
        )}
      </div>
    </DashboardCard>
  )
}

function StreakDashboard() {
  const [loading, setLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [fatalError, setFatalError] = useState('')
  const [profile, setProfile] = useState(null)
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setFatalError('')

      const token = getAuthToken()
      if (!token) {
        setAuthRequired(true)
        setLoading(false)
        return
      }

      const [profileRes, dashboardRes] = await Promise.all([
        safeCall(dashboardApi.getProfile),
        safeCall(dashboardApi.getStreakDashboard),
      ])

      if (!profileRes.data || !dashboardRes.data) {
        setFatalError(profileRes.error || dashboardRes.error || 'Failed to load streak dashboard')
        setLoading(false)
        return
      }

      setProfile(profileRes.data)
      setDashboard(dashboardRes.data)
      setLoading(false)
    }

    loadDashboard()
  }, [])

  const streak = dashboard?.streak || {}
  const heatmap = dashboard?.heatmap?.heatmap || []
  const leaderboard = dashboard?.leaderboard || []
  const suggestions = dashboard?.suggestions || []
  const notifications = dashboard?.notifications?.notifications || []
  const unreadCount = dashboard?.notifications?.unreadCount || 0
  const consistencyScore = Math.round(Number(dashboard?.consistency?.score || 0))

  const streakMessage = useMemo(() => {
    if (streak?.nextBadge?.remainingDays > 0) {
      return `${streak.nextBadge.remainingDays} more day${streak.nextBadge.remainingDays > 1 ? 's' : ''} to unlock ${streak.nextBadge.name}`
    }

    if (streak?.currentBadge) {
      return `You have unlocked ${streak.currentBadge}. Keep the fire going.`
    }

    return 'Start a streak today by logging one meaningful action.'
  }, [streak])

  if (fatalError) {
    return (
      <div className="min-h-screen bg-[#0F0F12] px-4 py-8 text-almond">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/40 bg-red-500/10 p-6">
          <p className="mb-2 flex items-center gap-2 text-lg font-semibold text-red-300">
            <AlertTriangle size={20} /> Failed to load streak dashboard
          </p>
          <p className="text-sm text-red-100/90">{fatalError}</p>
        </div>
      </div>
    )
  }

  if (authRequired) {
    return (
      <div className="min-h-screen bg-[#0F0F12] px-4 py-8 text-almond">
        <div className="mx-auto max-w-3xl rounded-2xl border border-blue-400/30 bg-blue-500/10 p-6">
          <p className="mb-2 text-lg font-semibold text-blue-200">Login required</p>
          <p className="text-sm text-blue-100/90">Please login first to view your streak dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mission-dashboard">
      <div className="mission-bg-orb orb-blue" />
      <div className="mission-bg-orb orb-purple" />
      <div className="mission-bg-orb orb-emerald" />

      <Sidebar role={profile?.role || 'student'} />

      <Motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 pb-24 md:ml-64 md:pb-8"
      >
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-orange-300/80">
                <Sparkles size={11} />
                Consistency Engine
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-almond">
                {profile?.name ? `${profile.name.split(' ')[0]}'s ` : ''}
                Streak Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/50">{streakMessage}</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/70">
              <CalendarRange size={16} className="text-blue-300" />
              Last active: <span className="font-semibold text-almond">{formatDate(streak?.lastActiveDate)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.2fr]">
            <StatTile
              icon={Flame}
              label="Current streak"
              value={streak?.currentStreak || 0}
              suffix="days"
              subtext="Daily activity keeps your streak alive."
              glow="amber"
              loading={loading}
            />
            <StatTile
              icon={Trophy}
              label="Longest streak"
              value={streak?.longestStreak || 0}
              suffix="days"
              subtext={`Consistency score ${consistencyScore}%`}
              glow="purple"
              loading={loading}
            />
            <BadgeStrip
              badges={streak?.badges || []}
              activeBadge={streak?.activeBadge}
              currentBadge={streak?.currentBadge}
              loading={loading}
            />
          </div>

          <div className="mt-5">
            <DashboardCard glow="blue" className="overflow-hidden">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">Activity Heatmap</p>
                  <h3 className="mt-2 text-2xl font-semibold text-almond">Last 90 days</h3>
                  <p className="mt-2 text-sm text-white/55">Activity heatmap — each cell represents a day, darker shades reflect higher activity counts.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/70">
                  Max daily activity <span className="ml-2 font-semibold text-almond">{dashboard?.heatmap?.maxCount || 0}</span>
                </div>
              </div>

              <div className="mt-6">
                <Heatmap data={heatmap} loading={loading} />
              </div>
            </DashboardCard>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <LeaderboardPanel leaderboard={leaderboard} loading={loading} />
            <SuggestionsPanel suggestions={suggestions} loading={loading} />
            <NotificationsPanel notifications={notifications} unreadCount={unreadCount} loading={loading} />
          </div>
        </div>
      </Motion.main>
    </div>
  )
}

export default StreakDashboard