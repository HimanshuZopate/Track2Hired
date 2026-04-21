import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  AlertCircle,
  Brain,
  Filter,
  Plus,
  Search,
  SearchX,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SkillCard from '../components/skills/SkillCard'
import SkillFormModal from '../components/skills/SkillFormModal'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

// ─── helpers ──────────────────────────────────────────────────────────────
const safeCall = async (fn) => {
  try {
    const res = await fn()
    return { data: res.data, error: null }
  } catch (err) {
    console.error('[Skills API Error]', err?.response?.status, err?.response?.data || err?.message)
    return { data: null, error: err?.response?.data?.message || err?.message || 'Request failed' }
  }
}

const CATEGORY_FILTERS = ['All', 'Technical', 'HR', 'Behavioral']
const LEVEL_FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced']

// ─── Skeleton loader ──────────────────────────────────────────────────────
function SkillSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-2/3 rounded-lg bg-white/[0.08] animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-white/[0.06] animate-pulse" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-14 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] animate-pulse" />
        <div className="flex gap-1.5">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full bg-white/[0.06] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────
function StatsBar({ skills }) {
  const total = skills.length
  const byCategory = useMemo(() => {
    const map = { Technical: 0, HR: 0, Behavioral: 0 }
    skills.forEach((s) => { if (map[s.category] !== undefined) map[s.category]++ })
    return map
  }, [skills])

  const avgConf = total
    ? (skills.reduce((sum, s) => sum + Number(s.confidenceScore || 0), 0) / total).toFixed(1)
    : '0.0'

  const stats = [
    { label: 'Total Skills', value: total, color: 'text-blue-300', glow: '0 0 18px rgba(59,130,246,0.4)' },
    { label: 'Technical', value: byCategory.Technical, color: 'text-blue-300', glow: '' },
    { label: 'HR', value: byCategory.HR, color: 'text-purple-300', glow: '' },
    { label: 'Behavioral', value: byCategory.Behavioral, color: 'text-amber-300', glow: '' },
    { label: 'Avg Confidence', value: `${avgConf}/5`, color: 'text-emerald-300', glow: '0 0 18px rgba(16,185,129,0.35)' },
  ]

  return (
    <Motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-center backdrop-blur-md"
          style={{ boxShadow: s.glow || 'none' }}
        >
          <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          <p className="mt-0.5 text-[11px] text-white/45">{s.label}</p>
        </div>
      ))}
    </Motion.div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────
function FilterBar({ catFilter, setCatFilter, levelFilter, setLevelFilter, search, setSearch }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="mb-6 flex flex-wrap gap-3 items-center"
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-sm text-almond placeholder-white/25 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition"
        />
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1.5">
        <Filter size={13} className="text-white/35" />
        <div className="flex gap-1">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                catFilter === c
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'text-white/50 hover:text-white/80 border border-transparent hover:border-white/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Level filter */}
      <div className="flex gap-1">
        {LEVEL_FILTERS.map((l) => (
          <button
            key={l}
            onClick={() => setLevelFilter(l)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              levelFilter === l
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                : 'text-white/50 hover:text-white/80 border border-transparent hover:border-white/10'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </Motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────
function Skills() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(null)

  // filters
  const [catFilter, setCatFilter] = useState('All')
  const [levelFilter, setLevelFilter] = useState('All')
  const [search, setSearch] = useState('')

  const toastTimer = useRef(null)

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  // Clean up timer on unmount
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // ── fetch ──
  const fetchSkills = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await safeCall(() => api.get('/api/skills'))
    if (err) {
      setError(err)
    } else {
      setSkills(data?.skills || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSkills() }, [fetchSkills])

  // ── filtered list ──
  const filtered = useMemo(() => {
    return skills.filter((s) => {
      const matchCat = catFilter === 'All' || s.category === catFilter
      const matchLevel = levelFilter === 'All' || s.level === levelFilter
      const matchSearch = !search || s.skillName.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchLevel && matchSearch
    })
  }, [skills, catFilter, levelFilter, search])

  // ── add skill ──
  const handleAdd = async (formData) => {
    setSubmitting(true)
    const { data, error: err } = await safeCall(() => api.post('/api/skills', formData))
    setSubmitting(false)
    if (err) {
      showToast(err, 'error')
      return
    }
    setSkills((prev) => [data.skill, ...prev])
    setModalOpen(false)
    showToast(`"${data.skill.skillName}" added successfully!`)
  }

  // ── edit skill ──
  const handleEdit = async (formData) => {
    if (!editTarget) return
    setSubmitting(true)
    const { data, error: err } = await safeCall(() =>
      api.put(`/api/skills/${editTarget._id}`, formData),
    )
    setSubmitting(false)
    if (err) {
      showToast(err, 'error')
      return
    }
    setSkills((prev) => prev.map((s) => (s._id === editTarget._id ? data.skill : s)))
    setEditTarget(null)
    setModalOpen(false)
    showToast(`"${data.skill.skillName}" updated!`)
  }

  // ── delete skill ──
  const handleDelete = async (id) => {
    setDeletingId(id)
    const { error: err } = await safeCall(() => api.delete(`/api/skills/${id}`))
    setDeletingId(null)
    if (err) {
      showToast(err, 'error')
      return
    }
    setSkills((prev) => prev.filter((s) => s._id !== id))
    showToast('Skill removed.')
  }

  const openEdit = (skill) => {
    setEditTarget(skill)
    setModalOpen(true)
  }

  const openAdd = () => {
    setEditTarget(null)
    setModalOpen(true)
  }

  return (
    <div className="mission-dashboard">
      {/* Background orbs */}
      <div className="mission-bg-orb orb-blue" />
      <div className="mission-bg-orb orb-purple" />
      <div className="mission-bg-orb orb-emerald" />

      <Sidebar />

      <Motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 pb-24 md:ml-64 md:pb-8"
      >
        <div className="mx-auto max-w-6xl px-4 py-8">

          {/* ── Page Header ── */}
          <Motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-blue-400/70">
                <Sparkles size={12} />
                Skill Arsenal
              </div>
              <h1 className="text-3xl font-bold text-almond tracking-tight">
                Skill{' '}
                <span
                  className="text-blue-400"
                  style={{ textShadow: '0 0 20px rgba(59,130,246,0.6)' }}
                >
                  Management
                </span>
              </h1>
              <p className="mt-1 text-sm text-white/45">
                Track your technical proficiency and interview readiness
              </p>
            </div>

            <Motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(139,92,246,0.85))',
                boxShadow: '0 0 28px rgba(59,130,246,0.4), 0 0 50px rgba(139,92,246,0.2)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <Plus size={16} />
              Add Skill
            </Motion.button>
          </Motion.div>

          {/* ── Stats Bar ── */}
          {!loading && !error && <StatsBar skills={skills} />}

          {/* ── Filter Bar ── */}
          {!loading && !error && skills.length > 0 && (
            <FilterBar
              catFilter={catFilter}
              setCatFilter={setCatFilter}
              levelFilter={levelFilter}
              setLevelFilter={setLevelFilter}
              search={search}
              setSearch={setSearch}
            />
          )}

          {/* ── Error state ── */}
          {error && (
            <Motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-300"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Failed to Load Skills</p>
                <p className="mt-0.5 text-red-300/80">{error}</p>
                <button
                  onClick={fetchSkills}
                  className="mt-2 rounded-lg border border-red-400/30 px-3 py-1 text-xs hover:bg-red-500/15 transition"
                >
                  Retry
                </button>
              </div>
            </Motion.div>
          )}

          {/* ── Loading skeletons ── */}
          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkillSkeleton key={i} />
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && skills.length === 0 && (
            <Motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-20 text-center"
            >
              <div
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: 'rgba(59,130,246,0.08)',
                  boxShadow: '0 0 30px rgba(59,130,246,0.2)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                <Brain size={28} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-almond">No skills yet</h3>
              <p className="mt-1.5 max-w-sm text-sm text-white/45">
                Start building your skill arsenal. Every skill you track brings you closer to your
                dream job.
              </p>
              <Motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={openAdd}
                className="mt-6 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(139,92,246,0.8))',
                  boxShadow: '0 0 20px rgba(59,130,246,0.3)',
                }}
              >
                <Plus size={15} />
                Add Your First Skill
              </Motion.button>
            </Motion.div>
          )}

          {/* ── No search match ── */}
          {!loading && !error && skills.length > 0 && filtered.length === 0 && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-16 text-center"
            >
              <SearchX size={32} className="text-white/25" />
              <p className="text-sm text-white/45">
                No skills match the current filters.{' '}
                <button
                  onClick={() => { setCatFilter('All'); setLevelFilter('All'); setSearch('') }}
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  Clear filters
                </button>
              </p>
            </Motion.div>
          )}

          {/* ── Skill Cards Grid ── */}
          {!loading && !error && filtered.length > 0 && (
            <Motion.div
              layout
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((skill, index) => (
                  <SkillCard
                    key={skill._id}
                    skill={skill}
                    index={index}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    deleting={deletingId === skill._id}
                  />
                ))}
              </AnimatePresence>
            </Motion.div>
          )}
        </div>
      </Motion.main>

      {/* ── Modal ── */}
      <SkillFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSubmit={editTarget ? handleEdit : handleAdd}
        initialData={editTarget}
        loading={submitting}
      />

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <Motion.div
            key="toast"
            initial={{ opacity: 0, y: 24, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-medium shadow-xl backdrop-blur-md"
            style={
              toast.type === 'error'
                ? {
                    background: 'rgba(239,68,68,0.15)',
                    borderColor: 'rgba(239,68,68,0.3)',
                    color: '#fca5a5',
                    boxShadow: '0 0 20px rgba(239,68,68,0.15)',
                  }
                : {
                    background: 'rgba(16,185,129,0.15)',
                    borderColor: 'rgba(16,185,129,0.3)',
                    color: '#6ee7b7',
                    boxShadow: '0 0 20px rgba(16,185,129,0.15)',
                  }
            }
          >
            {toast.message}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Skills
