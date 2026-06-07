import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plus,
  Check,
  Droplet,
  Apple,
  Brain,
  BookOpen,
  Pill,
  Sun,
  Moon,
  Dumbbell,
  Bike,
  Coffee,
  Heart,
  Music,
  Sunrise,
  Mail,
  Target,
  Wind,
  Leaf,
  Home,
  TrendingUp,
  PlusCircle,
  ListChecks,
  Settings,
  ChevronDown,
  ChevronUp,
  Upload
} from 'lucide-react'
import { today, getGreeting, formatDate } from '../../utils/dateUtils'
import BeaconMark from '../modules/BeaconMark'
import { importBackup } from '../../utils/storageUtils'
import { brand, pick } from '../../utils/brandVoice'
import { computeRunState } from '../../utils/streakUtils'

const getHabitIcon = (habitName) => {
  const n = habitName.toLowerCase()
  if (n.includes('water') || n.includes('hydrate'))
    return { Icon: Droplet,  bg: 'bg-cyan-500/20',    color: 'text-cyan-500' }
  if (n.includes('sleep') || n.includes('rest') || n.includes('nap'))
    return { Icon: Moon,     bg: 'bg-indigo-500/20',  color: 'text-indigo-400' }
  if (n.includes('eat') || n.includes('breakfast') || n.includes('lunch') || n.includes('dinner') || n.includes('food') || n.includes('meal'))
    return { Icon: Apple,    bg: 'bg-orange-500/20',  color: 'text-orange-400' }
  if (n.includes('fruit') || n.includes('veggie') || n.includes('vegetable') || n.includes('salad'))
    return { Icon: Apple,    bg: 'bg-green-400/20',   color: 'text-green-500' }
  if (n.includes('protein') || n.includes('calorie'))
    return { Icon: Dumbbell, bg: 'bg-red-400/20',     color: 'text-red-400' }
  if (n.includes('vitamin') || n.includes('pill') || n.includes('medicine') || n.includes('supplement') || n.includes('drug'))
    return { Icon: Pill,     bg: 'bg-blue-500/20',    color: 'text-blue-400' }
  if (n.includes('meditat') || n.includes('mindful') || n.includes('prayer') || n.includes('gratit'))
    return { Icon: Sunrise,  bg: 'bg-violet-400/20',  color: 'text-violet-400' }
  if (n.includes('read') || n.includes('book'))
    return { Icon: BookOpen, bg: 'bg-yellow-500/20',  color: 'text-yellow-500' }
  if (n.includes('journal') || n.includes('write') || n.includes('diary'))
    return { Icon: BookOpen, bg: 'bg-amber-500/20',   color: 'text-amber-400' }
  if (n.includes('yoga') || n.includes('stretch'))
    return { Icon: Target,   bg: 'bg-green-500/20',   color: 'text-green-500' }
  if (n.includes('workout') || n.includes('exercise') || n.includes('gym') || n.includes('jog') || n.includes('run') || n.includes('sport'))
    return { Icon: Dumbbell, bg: 'bg-red-500/20',     color: 'text-red-400' }
  if (n.includes('walk') || n.includes('step') || n.includes('hike'))
    return { Icon: Wind,     bg: 'bg-emerald-500/20', color: 'text-emerald-400' }
  if (n.includes('bike') || n.includes('ride') || n.includes('tennis') || n.includes('swim'))
    return { Icon: Bike,     bg: 'bg-app-accent/20',    color: 'text-app-accent-dim' }
  if (n.includes('coffee') || n.includes('tea'))
    return { Icon: Coffee,   bg: 'bg-amber-600/20',   color: 'text-amber-500' }
  if (n.includes('heart') || n.includes('love'))
    return { Icon: Heart,    bg: 'bg-pink-500/20',    color: 'text-pink-400' }
  if (n.includes('music') || n.includes('listen'))
    return { Icon: Music,    bg: 'bg-violet-500/20',  color: 'text-violet-400' }
  if (n.includes('email') || n.includes('inbox'))
    return { Icon: Mail,     bg: 'bg-sky-500/20',     color: 'text-sky-400' }
  if (n.includes('phone') || n.includes('screen'))
    return { Icon: Sun,      bg: 'bg-yellow-400/20',  color: 'text-yellow-400' }
  if (n.includes('sugar') || n.includes('beer') || n.includes('alcohol') || n.includes('smoke'))
    return { Icon: Target,   bg: 'bg-rose-500/20',    color: 'text-rose-400' }
  if (n.includes('plan') || n.includes('work'))
    return { Icon: Target,   bg: 'bg-slate-500/20',   color: 'text-slate-400' }
  return { Icon: Leaf, bg: 'bg-green-500/20', color: 'text-green-400' }
}


// ── Frequency progress helpers ─────────────────────────────────────────────────
const getWeekRange = () => {
  const t = today()
  const d = new Date(t + 'T00:00:00')
  const sun = new Date(d)
  sun.setDate(d.getDate() - d.getDay())
  const sat = new Date(sun)
  sat.setDate(sun.getDate() + 6)
  const fmt = x => formatDate(x)
  return { start: fmt(sun), end: fmt(sat) }
}

const countInRange = (habitId, logs, start, end) => {
  const t = today()
  const cap = end > t ? t : end
  return Object.keys(logs).filter(d => d >= start && d <= cap && (logs[d] || []).includes(habitId)).length
}

// Returns { periodDone, done, doneBeforeToday }
// periodDone = target was already met by PREVIOUS days (not counting today).
// This means today's tap is always either progress (under target) or a bonus (over target).
const getPeriodState = (habit, logs) => {
  const freq   = habit.frequency || 'daily'
  const target = habit.frequencyTarget || 1
  const todayStr = today()
  if (freq === 'daily') return { periodDone: false, done: 0, doneBeforeToday: 0 }

  let done = 0
  let doneBeforeToday = 0

  if (freq === 'weekly') {
    const { start, end } = getWeekRange()
    const cap = end > todayStr ? todayStr : end
    done            = Object.keys(logs).filter(d => d >= start && d <= cap      && (logs[d] || []).includes(habit.id)).length
    doneBeforeToday = Object.keys(logs).filter(d => d >= start && d <  todayStr && (logs[d] || []).includes(habit.id)).length
  } else if (freq === 'monthly') {
    const prefix = todayStr.substring(0, 7)
    done            = Object.keys(logs).filter(d => d.startsWith(prefix) && d <= todayStr && (logs[d] || []).includes(habit.id)).length
    doneBeforeToday = Object.keys(logs).filter(d => d.startsWith(prefix) && d <  todayStr && (logs[d] || []).includes(habit.id)).length
  }

  return { periodDone: doneBeforeToday >= target, done, doneBeforeToday }
}

function FreqBadge({ habit, logs }) {
  const freq   = habit.frequency || 'daily'
  const target = habit.frequencyTarget || 1

  if (freq === 'daily') {
    return <p className="text-[13px] text-app-secondary mt-0.5">Daily</p>
  }

  if (freq === 'weekly') {
    const { periodDone, done, doneBeforeToday } = getPeriodState(habit, logs)
    const isCheckedToday = (logs[today()] || []).includes(habit.id)
    const freqLabel = target === 1 ? 'Weekly' : `${target}x weekly`

    if (periodDone && isCheckedToday) {
      return (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[12px] font-medium text-app-secondary">{freqLabel}</span>
          <span className="text-app-elevated">·</span>
          <span className="text-[12px] font-medium text-amber-400/80">More than you promised yourself</span>
        </div>
      )
    }
    if (periodDone) {
      return (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[12px] font-medium text-app-secondary">{freqLabel}</span>
          <span className="text-app-elevated">·</span>
          <span className="text-[12px] font-medium text-app-accent/60">Done this week</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
        <span className="text-[13px] font-medium text-app-secondary">{freqLabel}</span>
        <span className="text-app-elevated">·</span>
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(target, 7) }, (_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < done ? 'bg-app-accent' : 'bg-app-elevated'}`} />
          ))}
        </div>
        <span className="text-[12px] text-app-secondary">{done} of {target}</span>
      </div>
    )
  }

  if (freq === 'monthly') {
    const { periodDone, done } = getPeriodState(habit, logs)
    const isCheckedToday = (logs[today()] || []).includes(habit.id)
    const freqLabel = target === 1 ? 'Monthly' : `${target}x monthly`

    if (periodDone && isCheckedToday) {
      return (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[12px] font-medium text-app-secondary">{freqLabel}</span>
          <span className="text-app-elevated">·</span>
          <span className="text-[12px] font-medium text-amber-400/80">More than you promised yourself</span>
        </div>
      )
    }
    if (periodDone) {
      return (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[12px] font-medium text-app-secondary">{freqLabel}</span>
          <span className="text-app-elevated">·</span>
          <span className="text-[12px] font-medium text-app-accent/60">Done this month</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[13px] font-medium text-app-secondary">{freqLabel}</span>
        <span className="text-app-elevated">·</span>
        <span className="text-[12px] text-app-secondary">
          {target === 1 ? (done > 0 ? `${done} of ${target}` : 'not yet') : `${done} of ${target}`}
        </span>
      </div>
    )
  }

  return null
}

export default function TodayScreen({
  userProfile,
  habits,
  logs,
  onToggleHabit,
  onNavigate,
  onAddHabit,
  onImportData,
  appWelcomeBack,  // app-level, computed once on session open (B6)
}) {
  const [expandedSections, setExpandedSections] = useState(() => {
    try {
      const stored = localStorage.getItem('beacon-today-sections')
      return stored ? JSON.parse(stored) : { morning: true, afternoon: true, evening: true, anytime: true }
    } catch {
      return { morning: true, afternoon: true, evening: true, anytime: true }
    }
  })

  // Persist section open/close state across navigations and app restarts
  useEffect(() => {
    localStorage.setItem('beacon-today-sections', JSON.stringify(expandedSections))
  }, [expandedSections])
  const [justCheckedId, setJustCheckedId]     = useState(null)
  // Transient card flash: { habitId, message } for 2.5 s, then null
  const [celebration, setCelebration]         = useState(null)
  const celebrationTimer                      = useRef(null)

  const todayStr  = today()
  const greeting  = getGreeting()
  const todayLogs = logs[todayStr] || []
  const hasLoggedToday = todayLogs.length > 0

  // ── Run states for daily habits (memoized — recomputes on logs/habits change) ─
  const runStates = useMemo(() => {
    const out = {}
    habits.filter(h => !h.archived && (h.frequency || 'daily') === 'daily')
          .forEach(h => { out[h.id] = computeRunState(h.id, logs) })
    return out
  }, [habits, logs])

  // ── C1 — Zone 2 day-status pill ────────────────────────────────────────────
  // Fixed-height slot always present; content is contextual.
  // Welcome-back is app-level (B6): computed once on session open from lastSeenDate,
  // shown here on return before the user has logged today. Never per-habit, never
  // re-derived on midnight rollover.
  const dayPill = (() => {
    if (hasLoggedToday) return brand.moments.daily_logged
    // Not yet logged — greet based on time of day or app-level absence
    const hour = new Date().getHours()
    if (hour >= 22 || hour < 5) return brand.moments.late_night_empty
    if (appWelcomeBack) return appWelcomeBack  // returning after ≥2 completed days away
    return brand.moments.start_ready
  })()

  // ── C3 — Celebration message when a habit is logged ────────────────────────
  const computeCelebration = (habitId, oldLogs, newLogs) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return null
    const freq    = habit.frequency || 'daily'
    const isDaily = freq === 'daily'

    // first_log ever in the app (no habit logged anywhere before this tap)
    const globalPrev = Object.values(oldLogs).reduce((a, arr) => a + arr.length, 0)
    if (globalPrev === 0) return pick(brand.moments.first_log)

    if (isDaily) {
      const oldState = computeRunState(habitId, oldLogs)
      const newState = computeRunState(habitId, newLogs)

      // Run milestones — highest match wins
      for (const n of [21, 14, 7, 3]) {
        if (newState.currentRun === n) return brand.moments.run[n]
      }
      // Total-days milestones — highest match wins
      for (const n of [365, 100, 50, 30, 10]) {
        if (newState.totalEver === n) return brand.moments.milestone[n]
      }
      // No rest-day transient message — run number + rest cell are the signals (decided, do not re-add)
    }

    // Extra mile: weekly/monthly target was already met before this log
    if (freq !== 'daily') {
      const { periodDone } = getPeriodState(habit, oldLogs)
      if (periodDone) return pick(brand.moments.extra_mile)
    }

    return null
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const habitsByTime = {
    morning:   habits.filter(h => !h.archived && h.time === 'morning'),
    afternoon: habits.filter(h => !h.archived && h.time === 'afternoon'),
    evening:   habits.filter(h => !h.archived && h.time === 'evening'),
    anytime:   habits.filter(h => !h.archived && h.time === 'anytime'),
  }

  const allHabits = habits.filter(h => !h.archived)

  const handleToggle = (habitId) => {
    const wasChecked = (logs[todayStr] || []).includes(habitId)

    // Build new logs first so celebration can compare old vs new state
    const newLogs = { ...logs }
    if (!newLogs[todayStr]) newLogs[todayStr] = []
    if (wasChecked) {
      newLogs[todayStr] = newLogs[todayStr].filter(id => id !== habitId)
    } else {
      newLogs[todayStr] = [...newLogs[todayStr], habitId]
      // Haptic + check animation
      setJustCheckedId(habitId)
      setTimeout(() => setJustCheckedId(null), 400)
      if (window.navigator?.vibrate) window.navigator.vibrate(10)
      // Compute and show celebration flash
      const msg = computeCelebration(habitId, logs, newLogs)
      if (msg) {
        clearTimeout(celebrationTimer.current)
        setCelebration({ habitId, message: msg })
        celebrationTimer.current = setTimeout(() => setCelebration(null), 4500)
      }
    }

    onToggleHabit(newLogs)
  }

  const isSectionComplete = (sectionHabits) =>
    sectionHabits.length > 0 && sectionHabits.every(h => todayLogs.includes(h.id))

  const renderSection = (time, TimeIcon) => {
    const sectionHabits = habitsByTime[time]
    if (sectionHabits.length === 0) return null

    const sectionKey = time.toLowerCase()
    const isExpanded = expandedSections[sectionKey]
    const isComplete = isSectionComplete(sectionHabits)

    return (
      <div key={time}>
        {/* Section header */}
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-4 py-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TimeIcon className={`w-3.5 h-3.5 ${isComplete ? 'text-app-accent-dim/50' : 'text-app-secondary'}`} />
            <span className={`text-xs font-semibold uppercase tracking-widest ${isComplete ? 'text-app-accent-dim/50' : 'text-app-secondary'}`}>
              {/* Section complete shows ✓ in muted teal-green (C — section_complete) */}
              {isComplete ? `${time} ✓` : time}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded
              ? <ChevronUp className="w-3.5 h-3.5 text-app-tertiary" />
              : <ChevronDown className="w-3.5 h-3.5 text-app-tertiary" />
            }
          </div>
        </button>

        {/* Habit cards */}
        {isExpanded && (
          <div className="px-3 pb-2 space-y-1.5 animate-section-fade">
            {sectionHabits.map((habit) => {
              const isCheckedToday = todayLogs.includes(habit.id)
              const justChecked    = justCheckedId === habit.id
              const { Icon: HabitIcon, bg, color } = getHabitIcon(habit.name)
              const freq    = habit.frequency || 'daily'
              const isDaily = freq === 'daily'

              // ── State derivation ──────────────────────────────────────────
              // periodDone = target already met by PREVIOUS days (not counting today)
              const { periodDone } = getPeriodState(habit, logs)

              // Four visual states:
              // 1) Unchecked (any freq, target not yet met before today, today not checked)
              //    → full opacity, gray empty circle
              // 2) Daily checked / under-target checked today (normal completion)
              //    → 70% opacity, green filled ✓, subtle strikethrough
              // 3) Period done, unchecked today
              //    → 65% opacity, teal outline circle (empty), no strikethrough
              // 4) Period done + checked today (extra mile)
              //    → full opacity, green filled ✓, warm card border, "More than you promised yourself"
              const isNormalChecked  = isCheckedToday && !periodDone   // state 2
              const isPeriodUnchecked = periodDone && !isCheckedToday  // state 3
              const isExtraMile      = periodDone && isCheckedToday    // state 4

              const circleBase = 'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all'
              const circleCls  = (isNormalChecked || isExtraMile) ? 'bg-app-green'
                               : isPeriodUnchecked                ? 'border-2 border-app-accent/50'
                               :                                    'border-2 border-app-secondary'

              return (
                <button
                  key={habit.id}
                  onClick={() => handleToggle(habit.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors ${
                    isExtraMile      ? 'bg-app-surface border border-amber-500/25 opacity-100 active:bg-app-elevated'
                    : isNormalChecked ? 'bg-app-surface opacity-[0.70] active:bg-app-elevated'
                    : isPeriodUnchecked? 'bg-app-surface opacity-[0.65] active:bg-app-elevated'
                    :                    'bg-app-surface active:bg-app-elevated'
                  }`}
                >
                  {/* Icon tile */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <HabitIcon className={`w-5 h-5 ${color}`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm font-semibold leading-snug transition-colors ${
                      (isNormalChecked || isExtraMile) ? 'text-app-tertiary line-through decoration-1' :
                      isPeriodUnchecked                ? 'text-app-tertiary' :
                                                         'text-app-text'
                    }`}>
                      {habit.name}
                    </p>
                    {/* C3 — meta line priority:
                        1. Transient celebration flash (2.5 s after tap)
                        2. Normal FreqBadge (welcome-back is app-level in day pill, never per-card) */}
                    {celebration?.habitId === habit.id ? (
                      <p className="text-[13px] text-app-accent-dim font-medium mt-0.5">
                        {celebration.message}
                      </p>
                    ) : (
                      <FreqBadge habit={habit} logs={logs} />
                    )}
                  </div>

                  {/* Checkbox */}
                  <div className={`${circleBase} ${circleCls} ${justChecked ? 'animate-spring-check' : ''}`}>
                    {(isNormalChecked || isExtraMile) && (
                      <Check className={`w-3.5 h-3.5 text-white stroke-[3] ${justChecked ? 'animate-check-draw' : ''}`} />
                    )}
                    {isPeriodUnchecked && (
                      <Check className="w-3.5 h-3.5 text-app-accent-dim/40 stroke-[2.5]" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-app-bg">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-app-bg px-4 safe-top pb-2">
        {/* Zone 1 — greeting only (C0) */}
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-app-secondary mb-0.5">
          <BeaconMark size={28} tile={false} className="flex-shrink-0 opacity-90" />
          {greeting}{userProfile.name ? `, ${userProfile.name.charAt(0).toUpperCase() + userProfile.name.slice(1)}` : ''}
        </p>
        {/* Date H1 */}
        <h1 className="text-[26px] font-bold text-app-text leading-tight">
          {'Today, ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </h1>
        {/* Zone 2 — day status pill (C1): fixed height, always present, never collapses */}
        <p className="h-[24px] flex items-center text-[13px] font-medium text-app-accent-dim mt-0.5 mb-2">
          {dayPill}
        </p>
        <div className="border-b border-app-elevated" />
      </div>

      {/* ── Habit list ── */}
      <div className="flex-1 overflow-y-auto">
        {allHabits.length === 0 ? (
          <EmptyState onAddHabit={onAddHabit} onImportData={onImportData} />
        ) : (
          <div className="pt-1 pb-2">
            {renderSection('morning', Sunrise)}
            {renderSection('afternoon', Sun)}
            {renderSection('evening', Moon)}
            {renderSection('anytime', Leaf)}
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav className="border-t border-app-elevated dark:border-white/10 bg-app-surface dark:bg-black flex items-center safe-area-inset-bottom px-2 py-3">
        <NavButton icon={Home}        active={true}  onClick={() => onNavigate('today')} />
        <NavButton icon={TrendingUp}  active={false} onClick={() => onNavigate('progress')} />
        <NavButton icon={PlusCircle}  active={false} onClick={onAddHabit} />
        <NavButton icon={ListChecks}  active={false} onClick={() => onNavigate('log')} />
        <NavButton icon={Settings}    active={false} onClick={() => onNavigate('settings')} />
      </nav>
    </div>
  )
}

// ── D7: First-run empty state ──────────────────────────────────────────────────
// Calm and inviting. Seedling icon (not the mark). One tight line. Two actions.
function EmptyState({ onAddHabit, onImportData }) {
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importBackup(file)
      onImportData?.(imported)
    } catch (err) {
      alert('Could not load that file.\n\nMake sure it is a Beacon backup (.json).\n\nDetails: ' + err.message)
    }
    e.target.value = ''
  }

  return (
    <div className="flex items-center justify-center h-full px-6">
      <div className="flex flex-col items-center gap-5 text-center max-w-xs">
        {/* Seedling icon in teal tile — echoes philosophy screen item 1 */}
        <div className="w-16 h-16 rounded-2xl bg-app-accent/15 flex items-center justify-center">
          <Leaf className="w-8 h-8 text-app-accent-dim" />
        </div>

        <p className="text-[15px] text-app-secondary leading-snug">
          Start small — that's the whole idea.
        </p>

        {/* Primary CTA — matches onboarding button style */}
        <button
          onClick={onAddHabit}
          className="w-full flex items-center justify-center gap-2 bg-app-green-surface border border-app-green text-white font-semibold py-3.5 px-6 rounded-2xl hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add your first habit
        </button>

        {/* Secondary CTA — quieter, for users restoring a backup */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-transparent border border-app-elevated text-app-secondary font-medium py-3 px-6 rounded-2xl hover:opacity-80 transition-opacity active:scale-[0.98] text-[14px]"
        >
          <Upload className="w-4 h-4" />
          Restore from backup
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}

function NavButton({ icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center py-1 transition-colors ${
        active ? 'text-app-text' : 'text-app-secondary hover:text-app-text'
      }`}
    >
      <Icon className="w-7 h-7" style={{ minWidth: 28, minHeight: 28 }} strokeWidth={2} />
    </button>
  )
}
