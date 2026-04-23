import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  Layers3,
  ListChecks,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  Wrench,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AnimatedButton from '../components/AnimatedButton'
import AnimatedCounter from '../components/AnimatedCounter'
import Sidebar from '../components/Sidebar'
import { resumeApi } from '../services/api'

const ATS_THRESHOLD = 70

const makeEducation = () => ({ degree: '', institution: '', year: '', cgpa: '' })
const makeProject = () => ({ title: '', description: '', techStack: '', link: '' })
const makeExperience = () => ({ company: '', role: '', duration: '', description: '' })

const createEmptyBuilderForm = () => ({
  profileId: '',
  templateKey: 'minimal-professional',
  targetJobRole: '',
  targetJobDescription: '',
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    portfolio: '',
  },
  skillsText: '',
  certificationsText: '',
  achievementsText: '',
  education: [makeEducation()],
  projects: [makeProject()],
  experience: [makeExperience()],
})

const parseLines = (value = '') =>
  String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)

const joinLines = (items = []) => items.filter(Boolean).join('\n')

const hasMeaningfulValues = (entry = {}) => Object.values(entry).some((value) => String(value || '').trim())

const profileToBuilderForm = (profile) => {
  if (!profile) return createEmptyBuilderForm()

  return {
    profileId: profile._id || '',
    templateKey: profile.templateKey || 'minimal-professional',
    targetJobRole: profile.targetJobRole || '',
    targetJobDescription: profile.targetJobDescription || '',
    personalInfo: {
      name: profile.personalInfo?.name || '',
      email: profile.personalInfo?.email || '',
      phone: profile.personalInfo?.phone || '',
      linkedin: profile.personalInfo?.linkedin || '',
      github: profile.personalInfo?.github || '',
      portfolio: profile.personalInfo?.portfolio || '',
    },
    skillsText: joinLines(profile.skills || []),
    certificationsText: joinLines(profile.certifications || []),
    achievementsText: joinLines(profile.achievements || []),
    education: (profile.education?.length ? profile.education : [makeEducation()]).map((item) => ({
      degree: item.degree || '',
      institution: item.institution || '',
      year: item.year || '',
      cgpa: item.cgpa || '',
    })),
    projects: (profile.projects?.length ? profile.projects : [makeProject()]).map((item) => ({
      title: item.title || '',
      description: item.description || '',
      techStack: item.techStack || '',
      link: item.link || '',
    })),
    experience: (profile.experience?.length ? profile.experience : [makeExperience()]).map((item) => ({
      company: item.company || '',
      role: item.role || '',
      duration: item.duration || '',
      description: item.description || '',
    })),
  }
}

const buildProfilePayload = (form) => ({
  ...(form.profileId ? { profileId: form.profileId } : {}),
  templateKey: form.templateKey,
  targetJobRole: form.targetJobRole,
  targetJobDescription: form.targetJobDescription,
  personalInfo: {
    ...form.personalInfo,
  },
  skills: parseLines(form.skillsText),
  certifications: parseLines(form.certificationsText),
  achievements: parseLines(form.achievementsText),
  education: form.education.filter(hasMeaningfulValues),
  projects: form.projects.filter(hasMeaningfulValues),
  experience: form.experience.filter(hasMeaningfulValues),
})

const extractActiveTab = (pathname) => (pathname.includes('/builder') ? 'builder' : 'analyzer')

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateAnalyzerForm = (form) => {
  if (!String(form.jobDescription || '').trim()) {
    return 'Job description is required'
  }

  if (!form.resumeFile && !String(form.resumeText || '').trim()) {
    return 'Upload a resume file or paste resume text before checking ATS score'
  }

  return ''
}

const validateBuilderForm = (form, { requireOptimizationFields = false } = {}) => {
  const errors = {}
  const payload = buildProfilePayload(form)

  if (!payload.personalInfo.name.trim()) {
    errors.name = 'Name is required'
  }

  if (!payload.personalInfo.email.trim()) {
    errors.email = 'Email is required'
  } else if (!emailRegex.test(payload.personalInfo.email.trim())) {
    errors.email = 'Enter a valid email address'
  }

  if (!payload.targetJobRole.trim()) {
    errors.targetJobRole = 'Target job role is required'
  }

  if (requireOptimizationFields && !payload.targetJobDescription.trim()) {
    errors.targetJobDescription = 'Target job description is required to optimize the resume'
  }

  if (requireOptimizationFields && payload.skills.length === 0) {
    errors.skillsText = 'Add at least one skill'
  }

  if (requireOptimizationFields && payload.education.length === 0) {
    errors.education = 'Add at least one education entry'
  }

  if (requireOptimizationFields && payload.projects.length === 0 && payload.experience.length === 0) {
    errors.projects = 'Add at least one project or one experience entry'
    errors.experience = 'Add at least one project or one experience entry'
  }

  return errors
}

const safeAnalysis = (analysis) => {
  if (!analysis) return null

  return {
    ...analysis,
    score: Number(analysis.score ?? analysis.atsScore ?? 0),
    readyBadge:
      analysis.readyBadge || (analysis.readyForATS || Number(analysis.score ?? analysis.atsScore ?? 0) >= ATS_THRESHOLD ? 'Ready for ATS' : 'Needs Optimization'),
    scoreBreakdown: analysis.scoreBreakdown || {},
    matchedKeywords: analysis.matchedKeywords || [],
    missingKeywords: analysis.missingKeywords || [],
    matchedSkills: analysis.matchedSkills || [],
    missingSkills: analysis.missingSkills || [],
    suggestions: analysis.suggestions || [],
    sectionsStatus: analysis.sectionsStatus || {},
    sectionWarnings: analysis.sectionWarnings || [],
    weakVerbSuggestions: analysis.weakVerbSuggestions || analysis.pitfalls?.weakActionVerbs || [],
    improvementChecklist: analysis.improvementChecklist || [],
    keywordMatchPercentage:
      analysis.keywordMatchPercentage ?? analysis.scoreBreakdown?.keywordMatch ?? 0,
  }
}

function TabButton({ active, onClick, icon, children }) {
  const IconComponent = icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? 'border-blue-400/50 bg-blue-500/15 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
          : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white'
      }`}
    >
      {IconComponent ? <IconComponent size={16} /> : null}
      {children}
    </button>
  )
}

function SectionShell({ title, kicker, icon: Icon, action, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-[0_25px_80px_rgba(2,6,23,0.25)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300/70">
            {Icon ? <Icon size={13} /> : null}
            {kicker}
          </div>
          <h2 className="text-xl font-semibold text-almond">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function StatPill({ label, value, tone = 'blue' }) {
  const tones = {
    blue: 'border-blue-400/20 bg-blue-500/10 text-blue-100',
    emerald: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
    amber: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
    slate: 'border-white/10 bg-white/[0.04] text-white/80',
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone] || tones.slate}`}>
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function KeywordChip({ children, tone = 'neutral' }) {
  const toneClasses = {
    positive: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100',
    negative: 'border-red-400/25 bg-red-500/10 text-red-100',
    neutral: 'border-white/10 bg-white/[0.04] text-white/85',
    warning: 'border-amber-400/25 bg-amber-500/10 text-amber-100',
  }

  return <span className={`rounded-full border px-3 py-1 text-xs ${toneClasses[tone] || toneClasses.neutral}`}>{children}</span>
}

function TextField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-[#0b1120]/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  )
}

function FieldError({ children }) {
  if (!children) return null
  return <p className="text-xs text-red-300">{children}</p>
}

function TextAreaField({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-[#0b1120]/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  )
}

function DynamicBlock({ title, items, onAdd, onRemove, renderItem, addLabel }) {
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-[#0b1120]/55 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-white/45">Add as much detail as needed, but keep it ATS-friendly.</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/15"
        >
          <Plus size={14} />
          {addLabel}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">{title} #{index + 1}</p>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-400/20 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-200 transition hover:bg-red-500/15"
                >
                  <Trash2 size={13} /> Remove
                </button>
              ) : null}
            </div>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalysisPanel({ analysis, onOpenBuilder, busy, title = 'ATS Analysis Snapshot' }) {
  if (busy) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-white/45">
        <Search size={30} className="mx-auto mb-3 text-white/25" />
        Upload or paste a resume and add a job description to get ATS scoring, keyword gaps, and optimization tips.
      </div>
    )
  }

  const normalized = safeAnalysis(analysis)
  const score = Number(normalized.score || 0)
  const breakdown = normalized.scoreBreakdown || {}
  const statusEntries = Object.entries(normalized.sectionsStatus || {})

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[250px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-[#0b1120]/60 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">{title}</p>
          <div className="mt-4 inline-flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-blue-400/15 bg-blue-500/10">
            <div>
              <AnimatedCounter value={score} suffix="" className="block text-5xl font-bold text-white" />
              <p className="text-sm text-white/55">ATS Score</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <KeywordChip tone={normalized.readyForATS ? 'positive' : 'warning'}>{normalized.readyBadge}</KeywordChip>
            <KeywordChip tone={score >= ATS_THRESHOLD ? 'positive' : 'negative'}>
              {score >= ATS_THRESHOLD ? 'Threshold Cleared' : 'Below Threshold'}
            </KeywordChip>
          </div>
          {score < ATS_THRESHOLD && onOpenBuilder ? (
            <button
              type="button"
              onClick={onOpenBuilder}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15"
            >
              Create Optimized Resume
              <ArrowRight size={15} />
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatPill label="Keyword Match" value={`${Math.round(breakdown.keywordMatch || 0)}%`} tone="blue" />
          <StatPill label="Skills Match" value={`${Math.round(breakdown.skillsMatch || 0)}%`} tone="emerald" />
          <StatPill label="Sections" value={`${Math.round(breakdown.sectionCompleteness || 0)}%`} tone="amber" />
          <StatPill label="Formatting" value={`${Math.round(breakdown.formatting || 0)}%`} tone="slate" />
          <StatPill label="Matched Keywords" value={normalized.matchedKeywords.length} tone="blue" />
          <StatPill label="Missing Keywords" value={normalized.missingKeywords.length} tone="amber" />
          <StatPill label="Missing Skills" value={normalized.missingSkills.length} tone="amber" />
          <StatPill label="ATS Badge" value={normalized.readyBadge} tone={normalized.readyForATS ? 'emerald' : 'amber'} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#0b1120]/55 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={16} className="text-blue-300" /> Suggestions
          </div>
          <ul className="space-y-3 text-sm text-white/80">
            {(normalized.suggestions || []).map((item, index) => (
              <li key={`${item}-${index}`} className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0b1120]/55 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <ListChecks size={16} className="text-emerald-300" /> Improvement Checklist
          </div>
          <div className="space-y-3">
            {(normalized.improvementChecklist || []).map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                {item.done ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                ) : (
                  <XCircle size={18} className="mt-0.5 shrink-0 text-amber-300" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/45">{item.done ? 'Completed' : 'Needs attention'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#0b1120]/55 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Search size={16} className="text-blue-300" /> Keyword Coverage
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Matched</p>
              <div className="flex flex-wrap gap-2">
                {(normalized.matchedKeywords || []).length ? (
                  normalized.matchedKeywords.map((keyword) => (
                    <KeywordChip key={keyword} tone="positive">{keyword}</KeywordChip>
                  ))
                ) : (
                  <p className="text-sm text-white/40">No matched keywords yet.</p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Missing</p>
              <div className="flex flex-wrap gap-2">
                {(normalized.missingKeywords || []).length ? (
                  normalized.missingKeywords.map((keyword) => (
                    <KeywordChip key={keyword} tone="negative">{keyword}</KeywordChip>
                  ))
                ) : (
                  <p className="text-sm text-emerald-200">Excellent. No missing keywords detected.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0b1120]/55 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <BadgeCheck size={16} className="text-emerald-300" /> Section Status
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {statusEntries.map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium capitalize text-white">{key.replace(/([A-Z])/g, ' $1')}</p>
                  {value ? (
                    <CheckCircle2 size={16} className="text-emerald-300" />
                  ) : (
                    <TriangleAlert size={16} className="text-amber-300" />
                  )}
                </div>
                <p className="mt-2 text-xs text-white/45">{value ? 'Detected successfully' : 'Missing or unclear for ATS'}</p>
              </div>
            ))}
          </div>

          {normalized.sectionWarnings.length ? (
            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-semibold">Section warnings</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {normalized.sectionWarnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {(normalized.weakVerbSuggestions || []).length ? (
        <div className="rounded-3xl border border-white/10 bg-[#0b1120]/55 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Wrench size={16} className="text-amber-300" /> Strong Verb Upgrade Suggestions
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {normalized.weakVerbSuggestions.map((item, index) => (
              <div key={`${item.weak}-${index}`} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <p className="text-sm font-medium text-white">
                  Replace <span className="text-amber-200">{item.weak}</span> with <span className="text-emerald-200">{item.replacement}</span>
                </p>
                <p className="mt-2 text-xs text-white/45">{item.sample}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LiveResumePreview({ form, templates, generatedResume, injectedKeywords }) {
  const selectedTemplate = templates.find((item) => item.key === form.templateKey)
  const previewData = useMemo(() => buildProfilePayload(form), [form])
  const previewSkills = previewData.skills.slice(0, 12)

  if (generatedResume?.htmlContent) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">Generated resume preview</p>
          <p className="mt-1 text-xs text-emerald-50/80">
            Template: {generatedResume.templateKey || form.templateKey} • ATS score: {generatedResume.atsScore ?? '--'}
          </p>
        </div>
        <iframe
          title="Generated Resume Preview"
          srcDoc={generatedResume.htmlContent}
          className="h-[720px] w-full rounded-3xl border border-white/10 bg-white"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0b1120]/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300/65">Live ATS Preview</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{previewData.personalInfo.name || 'Your Name'}</h3>
          <p className="mt-2 text-sm text-white/60">
            {[
              previewData.personalInfo.email,
              previewData.personalInfo.phone,
              previewData.personalInfo.linkedin,
              previewData.personalInfo.github,
            ]
              .filter(Boolean)
              .join(' • ') || 'Add contact info for an ATS-ready header'}
          </p>
        </div>

        <div className="space-y-2 text-right">
          <KeywordChip tone="neutral">{selectedTemplate?.name || 'Template Preview'}</KeywordChip>
          <p className="max-w-xs text-xs text-white/45">{selectedTemplate?.description || 'Choose a template and fill your profile to preview the generated structure.'}</p>
        </div>
      </div>

      <div className="space-y-5 text-sm text-white/80">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Professional Summary</p>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white/75">
            {previewData.targetJobRole
              ? `Targeting ${previewData.targetJobRole} opportunities with focus on ${previewSkills.slice(0, 4).join(', ') || 'skills, projects, and measurable execution'}.`
              : 'Add a target role to preview how your ATS summary will read.'}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Skills</p>
          <div className="flex flex-wrap gap-2">
            {previewSkills.length ? (
              previewSkills.map((skill) => <KeywordChip key={skill}>{skill}</KeywordChip>)
            ) : (
              <p className="text-white/45">Add skills, tools, and JD-aligned technologies.</p>
            )}
          </div>
          {injectedKeywords?.skills?.length ? (
            <p className="mt-3 text-xs text-emerald-200">Keyword injection candidates: {injectedKeywords.skills.join(', ')}</p>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Projects</p>
            <div className="space-y-3">
              {previewData.projects.length ? (
                previewData.projects.map((project, index) => (
                  <div key={`${project.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-semibold text-white">{project.title || `Project ${index + 1}`}</p>
                    <p className="mt-1 text-xs text-blue-100/70">{project.techStack || 'Tech stack goes here'}</p>
                    <p className="mt-2 text-sm text-white/70">{project.description || 'Add action-oriented project outcomes and metrics.'}</p>
                  </div>
                ))
              ) : (
                <p className="text-white/45">Add 1–3 strong projects with results.</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Experience</p>
            <div className="space-y-3">
              {previewData.experience.length ? (
                previewData.experience.map((item, index) => (
                  <div key={`${item.company}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-semibold text-white">{item.role || `Role ${index + 1}`}</p>
                    <p className="mt-1 text-xs text-blue-100/70">{[item.company, item.duration].filter(Boolean).join(' • ') || 'Company • Duration'}</p>
                    <p className="mt-2 text-sm text-white/70">{item.description || 'Use strong verbs and measurable impact in your experience bullets.'}</p>
                  </div>
                ))
              ) : (
                <p className="text-white/45">Add experience or internships to strengthen ATS structure.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Education</p>
            <div className="space-y-2">
              {previewData.education.length ? (
                previewData.education.map((item, index) => (
                  <div key={`${item.institution}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                    {[item.degree, item.institution, item.year, item.cgpa ? `CGPA ${item.cgpa}` : ''].filter(Boolean).join(' • ') || 'Degree • Institute • Year'}
                  </div>
                ))
              ) : (
                <p className="text-white/45">Add your education history.</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Certifications & Achievements</p>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-medium text-white">Certifications</p>
              <p className="mt-2 text-sm text-white/70">{previewData.certifications.join(', ') || 'Add certifications'}</p>
              <p className="mt-4 font-medium text-white">Achievements</p>
              <p className="mt-2 text-sm text-white/70">{previewData.achievements.join(', ') || 'Add measurable achievements'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResumeStudio() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = extractActiveTab(location.pathname)

  const [templates, setTemplates] = useState([])
  const [workspaceLoading, setWorkspaceLoading] = useState(true)
  const [workspaceError, setWorkspaceError] = useState('')

  const [builderForm, setBuilderForm] = useState(createEmptyBuilderForm())
  const [builderBusy, setBuilderBusy] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [builderFeedback, setBuilderFeedback] = useState('')
  const [builderErrors, setBuilderErrors] = useState({})
  const [generatedResume, setGeneratedResume] = useState(null)
  const [builderAnalysis, setBuilderAnalysis] = useState(null)

  const [analyzerForm, setAnalyzerForm] = useState({
    resumeFile: null,
    resumeText: '',
    jobDescription: '',
  })
  const [analyzerBusy, setAnalyzerBusy] = useState(false)
  const [analyzerError, setAnalyzerError] = useState('')
  const [analyzerResult, setAnalyzerResult] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadWorkspace = async () => {
      setWorkspaceLoading(true)
      setWorkspaceError('')

      try {
        const { data } = await resumeApi.getWorkspace()
        if (!mounted) return

        setTemplates(data.templates || [])

        if (data.latestProfile) {
          setBuilderForm(profileToBuilderForm(data.latestProfile))
          setAnalyzerForm((prev) => ({
            ...prev,
            jobDescription: prev.jobDescription || data.latestProfile.targetJobDescription || data.latestReport?.jobDescription || '',
          }))
        }

        if (data.latestResume) {
          setGeneratedResume(data.latestResume)
        }

        if (data.latestReport) {
          setAnalyzerResult(safeAnalysis(data.latestReport))
        }
      } catch (error) {
        if (!mounted) return
        setWorkspaceError(error?.response?.data?.message || 'Failed to load resume workspace')

        try {
          const { data } = await resumeApi.getTemplates()
          if (mounted) {
            setTemplates(data.templates || [])
          }
        } catch {
          // Ignore secondary template fetch failures
        }
      } finally {
        if (mounted) {
          setWorkspaceLoading(false)
        }
      }
    }

    loadWorkspace()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (location.pathname === '/resume') {
      navigate('/resume/analyzer', { replace: true })
    }
  }, [location.pathname, navigate])

  const currentAnalysis = useMemo(() => safeAnalysis(builderAnalysis || analyzerResult), [builderAnalysis, analyzerResult])

  const injectedKeywordHints = builderAnalysis?.jobKeywords || analyzerResult?.jobKeywords || null

  const switchTab = (tab) => navigate(tab === 'builder' ? '/resume/builder' : '/resume/analyzer')

  const openOptimizedResumeBuilder = () => {
    setBuilderForm((prev) => ({
      ...prev,
      targetJobDescription: analyzerForm.jobDescription || prev.targetJobDescription,
    }))
    switchTab('builder')
  }

  const updatePersonalInfo = (field, value) => {
    setBuilderForm((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }))
  }

  const updateArrayField = (section, index, field, value) => {
    setBuilderForm((prev) => ({
      ...prev,
      [section]: prev[section].map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }))
  }

  const addArrayItem = (section, factory) => {
    setBuilderForm((prev) => ({
      ...prev,
      [section]: [...prev[section], factory()],
    }))
  }

  const removeArrayItem = (section, index) => {
    setBuilderForm((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSaveProfile = async () => {
    setBuilderFeedback('')
    const validationErrors = validateBuilderForm(builderForm, { requireOptimizationFields: false })
    setBuilderErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setBuilderFeedback('Please resolve the highlighted profile fields before saving')
      return
    }

    setSaveBusy(true)

    try {
      const payload = buildProfilePayload(builderForm)
      const { data } = await resumeApi.saveProfile(payload)
      setBuilderForm(profileToBuilderForm(data.profile))
      setBuilderFeedback(data.message || 'Resume profile saved successfully')
    } catch (error) {
      setBuilderFeedback(error?.response?.data?.message || 'Unable to save resume profile')
    } finally {
      setSaveBusy(false)
    }
  }

  const handleGenerateResume = async () => {
    setBuilderFeedback('')
    const validationErrors = validateBuilderForm(builderForm, { requireOptimizationFields: true })
    setBuilderErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setBuilderFeedback('Please complete the required resume builder fields before generating your resume')
      return
    }

    setBuilderBusy(true)

    try {
      const payload = buildProfilePayload(builderForm)
      const { data } = await resumeApi.generateResume(payload)

      setBuilderForm(profileToBuilderForm(data.profile))
      setGeneratedResume(data.resume)
      setBuilderAnalysis(safeAnalysis(data.analysis))
      setAnalyzerResult(safeAnalysis(data.analysis))
      setAnalyzerForm((prev) => ({
        ...prev,
        jobDescription: payload.targetJobDescription || prev.jobDescription,
      }))
      setBuilderFeedback(data.message || 'Resume generated successfully')
    } catch (error) {
      setBuilderFeedback(error?.response?.data?.message || 'Unable to generate resume right now')
    } finally {
      setBuilderBusy(false)
    }
  }

  const handleAnalyzeResume = async () => {
    setAnalyzerError('')
    const validationMessage = validateAnalyzerForm(analyzerForm)

    if (validationMessage) {
      setAnalyzerError(validationMessage)
      return
    }

    setAnalyzerBusy(true)

    try {
      const formData = new FormData()
      if (analyzerForm.resumeFile) {
        formData.append('resumeFile', analyzerForm.resumeFile)
      }
      if (analyzerForm.resumeText.trim()) {
        formData.append('resumeText', analyzerForm.resumeText.trim())
      }
      formData.append('jobDescription', analyzerForm.jobDescription)

      const { data } = await resumeApi.analyzeResume(formData)

      const normalized = safeAnalysis(data)
      setAnalyzerResult(normalized)
      setBuilderAnalysis(normalized)
      setBuilderForm((prev) => ({
        ...prev,
        targetJobDescription: prev.targetJobDescription || analyzerForm.jobDescription,
      }))
    } catch (error) {
      setAnalyzerError(error?.response?.data?.message || 'Unable to analyze resume at the moment')
    } finally {
      setAnalyzerBusy(false)
    }
  }

  const handleDownloadResume = async () => {
    if (!generatedResume?._id) return

    try {
      const { data } = await resumeApi.downloadResume(generatedResume._id)
      const link = document.createElement('a')
      link.href = data.pdfUrl
      link.download = data.fileName || 'track2hired-resume.pdf'
      link.click()
    } catch (error) {
      setBuilderFeedback(error?.response?.data?.message || 'Failed to download generated PDF')
    }
  }

  return (
    <div className="mission-dashboard">
      <div className="mission-bg-orb orb-blue" />
      <div className="mission-bg-orb orb-purple" />
      <div className="mission-bg-orb orb-emerald" />

      <Sidebar />

      <Motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 pb-24 md:ml-64 md:pb-10"
      >
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-300/75">
                <FileText size={13} /> Resume Intelligence Suite
              </div>
              <h1 className="text-3xl font-bold text-almond sm:text-4xl">ATS Resume Analyzer + Builder</h1>
              <p className="mt-3 max-w-3xl text-sm text-white/55 sm:text-base">
                Analyze uploaded resumes against job descriptions, detect ATS gaps, inject relevant keywords, and generate polished resume PDFs with three ATS-friendly templates.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <TabButton active={activeTab === 'analyzer'} onClick={() => switchTab('analyzer')} icon={Search}>
                Resume Analyzer
              </TabButton>
              <TabButton active={activeTab === 'builder'} onClick={() => switchTab('builder')} icon={Layers3}>
                Resume Builder
              </TabButton>
            </div>
          </div>

          {workspaceError ? (
            <div className="mb-6 rounded-3xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-semibold">Workspace notice</p>
              <p className="mt-1">{workspaceError}</p>
            </div>
          ) : null}

          <div className="mb-8 grid gap-4 lg:grid-cols-4">
            <StatPill label="ATS Threshold" value={`${ATS_THRESHOLD}+`} tone="blue" />
            <StatPill label="Templates" value={templates.length || 3} tone="emerald" />
            <StatPill label="Latest Score" value={currentAnalysis ? `${Math.round(currentAnalysis.score || 0)}` : '--'} tone="amber" />
            <StatPill label="Keyword Match" value={currentAnalysis ? `${Math.round(currentAnalysis.keywordMatchPercentage || 0)}%` : '--'} tone="slate" />
          </div>

          {activeTab === 'analyzer' ? (
            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
              <SectionShell
                title="Analyze Resume Against Job Description"
                kicker="Resume Analyzer"
                icon={Search}
                action={
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
                    Upload PDF or paste raw resume text
                  </div>
                }
              >
                <div className="space-y-4">
                  <label className="block space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">Resume Upload</span>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-[#0b1120]/60 px-5 py-8 text-center transition hover:border-blue-400/30 hover:bg-blue-500/[0.04]">
                      <Upload size={26} className="mb-3 text-blue-300" />
                      <p className="text-sm font-medium text-white">Drop a PDF/text file or click to choose</p>
                      <p className="mt-1 text-xs text-white/45">Max 5 MB • PDF recommended • ATS extraction via pdf-parse</p>
                      <input
                        type="file"
                        accept=".pdf,.txt"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null
                          setAnalyzerForm((prev) => ({ ...prev, resumeFile: file }))
                          if (analyzerError) setAnalyzerError('')
                        }}
                      />
                      {analyzerForm.resumeFile ? (
                        <p className="mt-3 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
                          Selected: {analyzerForm.resumeFile.name}
                        </p>
                      ) : null}
                    </label>
                  </label>

                  <TextAreaField
                    label="Or Paste Resume Text"
                    value={analyzerForm.resumeText}
                    onChange={(value) => {
                      setAnalyzerForm((prev) => ({ ...prev, resumeText: value }))
                      if (analyzerError) setAnalyzerError('')
                    }}
                    placeholder="Paste resume content here if you want to analyze raw text instead of uploading a PDF."
                    rows={8}
                  />

                  <TextAreaField
                    label="Job Description"
                    value={analyzerForm.jobDescription}
                    onChange={(value) => {
                      setAnalyzerForm((prev) => ({ ...prev, jobDescription: value }))
                      setBuilderForm((prev) => ({ ...prev, targetJobDescription: prev.targetJobDescription || value }))
                      if (analyzerError) setAnalyzerError('')
                    }}
                    placeholder="Paste the target job description to extract keywords, skills, tools, and roles."
                    rows={10}
                  />

                  {analyzerError ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{analyzerError}</div>
                  ) : null}

                  <AnimatedButton loading={analyzerBusy} disabled={false} onClick={handleAnalyzeResume}>
                    <Search size={16} /> Check ATS Score
                  </AnimatedButton>
                </div>
              </SectionShell>

              <SectionShell title="Analysis Results" kicker="ATS Checker" icon={BadgeCheck}>
                <AnalysisPanel analysis={analyzerResult} busy={analyzerBusy || (workspaceLoading && !analyzerResult)} onOpenBuilder={openOptimizedResumeBuilder} />
              </SectionShell>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <SectionShell
                  title="Build ATS-Friendly Resume"
                  kicker="Resume Builder"
                  icon={Layers3}
                  action={
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.07]"
                      >
                        {saveBusy ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                        Save Profile
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateResume}
                        disabled={builderBusy}
                        className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {builderBusy ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}
                        Create Resume
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-5">
                    {Object.keys(builderErrors).length > 0 ? (
                      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
                        <p className="font-semibold">Required fields missing</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-red-100/90">
                          {Object.values(builderErrors).map((message, index) => (
                            <li key={`${message}-${index}`}>{message}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <TextField label="Full Name" value={builderForm.personalInfo.name} onChange={(value) => {
                          updatePersonalInfo('name', value)
                          if (builderErrors.name) setBuilderErrors((prev) => ({ ...prev, name: '' }))
                        }} placeholder="John Doe" />
                        <FieldError>{builderErrors.name}</FieldError>
                      </div>
                      <div>
                        <TextField label="Email" value={builderForm.personalInfo.email} onChange={(value) => {
                          updatePersonalInfo('email', value)
                          if (builderErrors.email) setBuilderErrors((prev) => ({ ...prev, email: '' }))
                        }} placeholder="john@example.com" type="email" />
                        <FieldError>{builderErrors.email}</FieldError>
                      </div>
                      <TextField label="Phone" value={builderForm.personalInfo.phone} onChange={(value) => updatePersonalInfo('phone', value)} placeholder="+91 9876543210" />
                      <div>
                        <TextField label="Target Job Role" value={builderForm.targetJobRole} onChange={(value) => {
                          setBuilderForm((prev) => ({ ...prev, targetJobRole: value }))
                          if (builderErrors.targetJobRole) setBuilderErrors((prev) => ({ ...prev, targetJobRole: '' }))
                        }} placeholder="Full Stack Developer" />
                        <FieldError>{builderErrors.targetJobRole}</FieldError>
                      </div>
                      <TextField label="LinkedIn" value={builderForm.personalInfo.linkedin} onChange={(value) => updatePersonalInfo('linkedin', value)} placeholder="linkedin.com/in/username" />
                      <TextField label="GitHub" value={builderForm.personalInfo.github} onChange={(value) => updatePersonalInfo('github', value)} placeholder="github.com/username" />
                      <TextField label="Portfolio" value={builderForm.personalInfo.portfolio} onChange={(value) => updatePersonalInfo('portfolio', value)} placeholder="portfolio.yourdomain.com" />
                      <label className="block space-y-2">
                        <span className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">Template</span>
                        <select
                          value={builderForm.templateKey}
                          onChange={(event) => setBuilderForm((prev) => ({ ...prev, templateKey: event.target.value }))}
                          className="w-full rounded-2xl border border-white/10 bg-[#0b1120]/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
                        >
                          {(templates.length ? templates : [
                            { key: 'minimal-professional', name: 'Minimal Professional' },
                            { key: 'modern-clean', name: 'Modern Clean' },
                            { key: 'compact-one-page', name: 'Compact One-Page' },
                          ]).map((template) => (
                            <option key={template.key} value={template.key}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <TextAreaField
                      label="Target Job Description"
                      value={builderForm.targetJobDescription}
                      onChange={(value) => {
                        setBuilderForm((prev) => ({ ...prev, targetJobDescription: value }))
                        if (builderErrors.targetJobDescription) setBuilderErrors((prev) => ({ ...prev, targetJobDescription: '' }))
                      }}
                      placeholder="Paste the JD here to inject the most relevant skills and role keywords into the resume."
                      rows={7}
                    />
                    <FieldError>{builderErrors.targetJobDescription}</FieldError>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <TextAreaField
                          label="Skills"
                          value={builderForm.skillsText}
                          onChange={(value) => {
                            setBuilderForm((prev) => ({ ...prev, skillsText: value }))
                            if (builderErrors.skillsText) setBuilderErrors((prev) => ({ ...prev, skillsText: '' }))
                          }}
                          placeholder="React\nNode.js\nMongoDB\nDocker"
                          rows={7}
                        />
                        <FieldError>{builderErrors.skillsText}</FieldError>
                      </div>
                      <TextAreaField
                        label="Certifications"
                        value={builderForm.certificationsText}
                        onChange={(value) => setBuilderForm((prev) => ({ ...prev, certificationsText: value }))}
                        placeholder="AWS Cloud Practitioner\nMeta Front-End Certificate"
                        rows={7}
                      />
                    </div>

                    <TextAreaField
                      label="Achievements"
                      value={builderForm.achievementsText}
                      onChange={(value) => setBuilderForm((prev) => ({ ...prev, achievementsText: value }))}
                      placeholder="Reduced API response time by 32%\nWon national hackathon finalist position"
                      rows={4}
                    />

                    <DynamicBlock
                      title="Education"
                      items={builderForm.education}
                      onAdd={() => addArrayItem('education', makeEducation)}
                      onRemove={(index) => removeArrayItem('education', index)}
                      addLabel="Add Education"
                      renderItem={(item, index) => (
                        <div className="grid gap-4 md:grid-cols-2">
                          <TextField label="Degree" value={item.degree} onChange={(value) => updateArrayField('education', index, 'degree', value)} placeholder="B.Tech Computer Science" />
                          <TextField label="Institution" value={item.institution} onChange={(value) => updateArrayField('education', index, 'institution', value)} placeholder="ABC University" />
                          <TextField label="Year" value={item.year} onChange={(value) => updateArrayField('education', index, 'year', value)} placeholder="2026" />
                          <TextField label="CGPA / Score" value={item.cgpa} onChange={(value) => updateArrayField('education', index, 'cgpa', value)} placeholder="8.7" />
                        </div>
                      )}
                    />
                    <FieldError>{builderErrors.education}</FieldError>

                    <DynamicBlock
                      title="Projects"
                      items={builderForm.projects}
                      onAdd={() => addArrayItem('projects', makeProject)}
                      onRemove={(index) => removeArrayItem('projects', index)}
                      addLabel="Add Project"
                      renderItem={(item, index) => (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <TextField label="Project Title" value={item.title} onChange={(value) => updateArrayField('projects', index, 'title', value)} placeholder="Track2Hired Resume Suite" />
                            <TextField label="Tech Stack" value={item.techStack} onChange={(value) => updateArrayField('projects', index, 'techStack', value)} placeholder="React, Node.js, MongoDB" />
                          </div>
                          <TextField label="Project Link" value={item.link} onChange={(value) => updateArrayField('projects', index, 'link', value)} placeholder="https://github.com/your-project" />
                          <TextAreaField label="Project Description" value={item.description} onChange={(value) => updateArrayField('projects', index, 'description', value)} placeholder="Describe project scope, actions, and measurable impact. Multiple lines become ATS bullets." rows={5} />
                        </div>
                      )}
                    />
                    <FieldError>{builderErrors.projects}</FieldError>

                    <DynamicBlock
                      title="Experience"
                      items={builderForm.experience}
                      onAdd={() => addArrayItem('experience', makeExperience)}
                      onRemove={(index) => removeArrayItem('experience', index)}
                      addLabel="Add Experience"
                      renderItem={(item, index) => (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <TextField label="Role" value={item.role} onChange={(value) => updateArrayField('experience', index, 'role', value)} placeholder="Software Engineer Intern" />
                            <TextField label="Company" value={item.company} onChange={(value) => updateArrayField('experience', index, 'company', value)} placeholder="Track2Hired Labs" />
                          </div>
                          <TextField label="Duration" value={item.duration} onChange={(value) => updateArrayField('experience', index, 'duration', value)} placeholder="Jan 2025 - Jun 2025" />
                          <TextAreaField label="Experience Description" value={item.description} onChange={(value) => updateArrayField('experience', index, 'description', value)} placeholder="Use strong action verbs and include metrics. Multiple lines will become ATS bullets." rows={5} />
                        </div>
                      )}
                    />
                    <FieldError>{builderErrors.experience}</FieldError>

                    {builderFeedback ? (
                      <div className={`rounded-2xl border p-4 text-sm ${builderFeedback.toLowerCase().includes('unable') || builderFeedback.toLowerCase().includes('failed') ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'}`}>
                        {builderFeedback}
                      </div>
                    ) : null}
                  </div>
                </SectionShell>

                {builderAnalysis ? (
                  <SectionShell title="Generated Resume ATS Report" kicker="Builder Insights" icon={BadgeCheck}>
                    <AnalysisPanel analysis={builderAnalysis} onOpenBuilder={null} />
                  </SectionShell>
                ) : null}
              </div>

              <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                <SectionShell
                  title="Template Preview"
                  kicker="Live Preview"
                  icon={FileText}
                  action={
                    generatedResume?._id ? (
                      <button
                        type="button"
                        onClick={handleDownloadResume}
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                      >
                        <Download size={15} /> Download Resume
                      </button>
                    ) : null
                  }
                >
                  <LiveResumePreview form={builderForm} templates={templates} generatedResume={generatedResume} injectedKeywords={injectedKeywordHints} />
                </SectionShell>

                <SectionShell title="Template Library" kicker="ATS-Friendly Templates" icon={Layers3}>
                  <div className="space-y-3">
                    {(templates.length ? templates : [
                      {
                        key: 'minimal-professional',
                        name: 'Minimal Professional',
                        description: 'Classic ATS-friendly single-column layout with crisp hierarchy.',
                        previewLabel: 'Best for software, analytics, and general professional roles',
                      },
                      {
                        key: 'modern-clean',
                        name: 'Modern Clean',
                        description: 'Balanced modern styling with clean chips and stronger visual grouping.',
                        previewLabel: 'Best for product, design, frontend, and startup-friendly roles',
                      },
                      {
                        key: 'compact-one-page',
                        name: 'Compact One-Page',
                        description: 'Dense ATS-safe layout optimized to fit maximum value on one page.',
                        previewLabel: 'Best for fresher and early-career one-page resumes',
                      },
                    ]).map((template) => {
                      const selected = builderForm.templateKey === template.key

                      return (
                        <button
                          key={template.key}
                          type="button"
                          onClick={() => setBuilderForm((prev) => ({ ...prev, templateKey: template.key }))}
                          className={`w-full rounded-3xl border p-4 text-left transition ${
                            selected
                              ? 'border-blue-400/40 bg-blue-500/10 shadow-[0_0_24px_rgba(59,130,246,0.15)]'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold text-white">{template.name}</h3>
                              <p className="mt-1 text-sm text-white/55">{template.description}</p>
                              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-blue-200/60">{template.previewLabel}</p>
                            </div>
                            {selected ? <BadgeCheck size={18} className="text-blue-300" /> : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </SectionShell>

                <SectionShell title="Builder Readiness Guide" kicker="ATS Rules" icon={Briefcase}>
                  <div className="space-y-3 text-sm text-white/70">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="font-semibold text-white">One page preferred</p>
                      <p className="mt-1">Keep the resume to one page when possible. Expand to two pages only if truly necessary.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="font-semibold text-white">Use strong verbs</p>
                      <p className="mt-1">Prefer Developed, Implemented, Designed, Optimized, Led, Engineered, Built, Created, and Analyzed.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="font-semibold text-white">Mirror job language truthfully</p>
                      <p className="mt-1">The generator injects matching skills and keywords into the skills and project sections without inventing experience.</p>
                    </div>
                  </div>
                </SectionShell>
              </div>
            </div>
          )}
        </div>
      </Motion.main>
    </div>
  )
}

export default ResumeStudio