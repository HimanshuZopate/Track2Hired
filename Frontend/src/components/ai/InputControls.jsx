import { motion as Motion } from 'framer-motion'
import { BookOpen, ChevronDown, Cpu, Hash, Layers, Sparkles, Zap } from 'lucide-react'

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
export const TYPES        = ['MCQ', 'Theory', 'Coding', 'Mixed']
export const COUNTS       = [3, 5, 8, 10]

const DIFF_COLORS = {
  Beginner:     'text-emerald-300',
  Intermediate: 'text-amber-300',
  Advanced:     'text-red-300',
}

const TYPE_ICONS = {
  MCQ:    <Hash size={13} />,
  Theory: <BookOpen size={13} />,
  Coding: <Cpu size={13} />,
  Mixed:  <Layers size={13} />,
}

function SelectField({ label, icon, value, onChange, options, renderOption, disabled }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-white/40">
        {icon}
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-white/10 bg-[#111218] px-4 py-2.5 text-sm text-almond outline-none transition focus:border-blue-500/50 focus:shadow-[0_0_0_1px_rgba(59,130,246,0.2)] disabled:opacity-50"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {renderOption ? renderOption(o) : o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35"
        />
      </div>
    </div>
  )
}

function InputControls({ form, onChange, onGenerate, loading, disabled }) {
  const { skill, difficulty, type, count } = form

  return (
    <div
      className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] p-5 backdrop-blur-md"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(14,15,22,0.85) 100%)',
        boxShadow: '0 0 0 1px rgba(139,92,246,0.1), 0 8px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Panel title */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          <Zap size={15} className="text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-almond">Configure Session</p>
          <p className="text-[11px] text-white/35">Set your practice parameters</p>
        </div>
      </div>

      {/* Skill input */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-white/40">
          <Sparkles size={11} />
          Skill / Topic
        </label>
        <input
          type="text"
          value={skill}
          onChange={(e) => onChange('skill', e.target.value)}
          disabled={disabled}
          placeholder="e.g. React.js, System Design…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-almond placeholder-white/20 outline-none transition focus:border-blue-500/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_1px_rgba(59,130,246,0.2)] disabled:opacity-50"
        />
      </div>

      {/* Difficulty */}
      <SelectField
        label="Difficulty"
        icon={<Layers size={11} />}
        value={difficulty}
        onChange={(v) => onChange('difficulty', v)}
        options={DIFFICULTIES}
        disabled={disabled}
        renderOption={(o) => o}
      />

      {/* Type */}
      <SelectField
        label="Question Type"
        icon={<BookOpen size={11} />}
        value={type}
        onChange={(v) => onChange('type', v)}
        options={TYPES}
        disabled={disabled}
      />

      {/* Count */}
      <SelectField
        label="No. of Questions"
        icon={<Hash size={11} />}
        value={count}
        onChange={(v) => onChange('count', Number(v))}
        options={COUNTS}
        disabled={disabled}
      />

      {/* Difficulty indicator */}
      <div
        className="rounded-xl border border-white/[0.07] px-4 py-2.5"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Current level</span>
          <span className={`text-xs font-semibold ${DIFF_COLORS[difficulty]}`}>
            {difficulty}
          </span>
        </div>
        <div className="mt-2 flex gap-1">
          {DIFFICULTIES.map((d, i) => (
            <div
              key={d}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  i <= DIFFICULTIES.indexOf(difficulty)
                    ? i === 0 ? '#34d399' : i === 1 ? '#fbbf24' : '#f87171'
                    : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Type badge row */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => onChange('type', t)}
            disabled={disabled}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
              type === t
                ? 'border-blue-400/35 bg-blue-500/15 text-blue-300'
                : 'border-white/[0.07] text-white/40 hover:border-white/15 hover:text-white/70'
            }`}
          >
            {TYPE_ICONS[t]}
            {t}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <Motion.button
        onClick={onGenerate}
        disabled={loading || !skill.trim()}
        whileHover={{ scale: loading || !skill.trim() ? 1 : 1.03 }}
        whileTap={{ scale: loading || !skill.trim() ? 1 : 0.97 }}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.9))',
          boxShadow: loading || !skill.trim()
            ? 'none'
            : '0 0 30px rgba(139,92,246,0.45), 0 0 60px rgba(59,130,246,0.2)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles size={15} />
            Generate Questions
          </>
        )}
      </Motion.button>
    </div>
  )
}

export default InputControls
