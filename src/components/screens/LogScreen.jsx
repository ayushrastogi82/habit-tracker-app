import { useState, useRef } from 'react'
import {
  Check, ChevronLeft, ChevronRight,
  Home, TrendingUp, PlusCircle, ListChecks, Settings,
  Sunrise, Sun, Moon, Leaf
} from 'lucide-react'
import { today, daysAgo, formatDate } from '../../utils/dateUtils'

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDayLabel = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  if (dateStr === today())    return `Today · ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
  if (dateStr === daysAgo(1)) return `Yesterday · ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const getFreqContext = (habit, logs, dateStr) => {
  const freq = habit.frequency, target = habit.frequencyTarget || 1
  if (freq !== 'weekly' && freq !== 'monthly') return null
  if (freq === 'weekly') {
    const d   = new Date(dateStr + 'T00:00:00')
    const sun = new Date(d); sun.setDate(d.getDate() - d.getDay())
    const sat = new Date(sun); sat.setDate(sun.getDate() + 6)
    const fmt = x => formatDate(x)
    const done = Object.keys(logs).filter(
      k => k >= fmt(sun) && k <= fmt(sat) && (logs[k] || []).includes(habit.id)
    ).length
    return `${target === 1 ? '1× week' : `${target}× week`} · ${done} of ${target}`
  }
  const prefix = dateStr.substring(0, 7)
  const done = Object.keys(logs).filter(
    k => k.startsWith(prefix) && (logs[k] || []).includes(habit.id)
  ).length
  return `${target === 1 ? 'Monthly' : `${target}× month`} · ${done} of ${target}`
}

const timeIcons = { morning: Sunrise, afternoon: Sun, evening: Moon, anytime: Leaf }

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function LogScreen({ habits, logs, onToggleHabit, onNavigate, onAddHabit }) {
  const todayStr = today()

  // Always starts at yesterday — Log owns the past, Today screen owns today
  const [viewDate, setViewDate] = useState(daysAgo(1))
  const dateInputRef = useRef(null)

  const activeHabits = habits.filter(h => !h.archived)

  // Left boundary: earliest habit creation date (don't go further back)
  const earliestDate = activeHabits.reduce((earliest, h) => {
    const d = h.createdAt ? h.createdAt.substring(0, 10) : todayStr
    return d < earliest ? d : earliest
  }, todayStr)

  // True when at least one habit existed before today — i.e. there are past days to log
  const hasAnythingToLog = activeHabits.length > 0 && earliestDate < todayStr

  const yesterdayStr = daysAgo(1)
  const canGoBack    = viewDate > earliestDate
  const canGoForward = viewDate < yesterdayStr  // right boundary is yesterday — today belongs to Today screen

  // Only show habits that existed on the viewed date (created on or before it)
  const habitsForDate = activeHabits.filter(h =>
    !h.createdAt || h.createdAt.substring(0, 10) <= viewDate
  )

  const shiftDate = (delta) => {
    const d = new Date(viewDate + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    const next = formatDate(d)
    if (next < earliestDate || next > todayStr) return
    setViewDate(next)
  }

  const handleJumpToDate = (dateStr) => {
    if (!dateStr) return
    if (dateStr < earliestDate || dateStr > yesterdayStr) return
    setViewDate(dateStr)
  }

  const habitsByTime = {
    morning:   habitsForDate.filter(h => h.time === 'morning'),
    afternoon: habitsForDate.filter(h => h.time === 'afternoon'),
    evening:   habitsForDate.filter(h => h.time === 'evening'),
    anytime:   habitsForDate.filter(h => !h.time || h.time === 'anytime'),
  }

  const handleToggle = (habitId) => {
    const newLogs = { ...logs }
    if (!newLogs[viewDate]) newLogs[viewDate] = []
    newLogs[viewDate] = newLogs[viewDate].includes(habitId)
      ? newLogs[viewDate].filter(id => id !== habitId)
      : [...newLogs[viewDate], habitId]
    onToggleHabit(newLogs)
  }

  return (
    <div className="h-screen flex flex-col bg-app-bg">

      {/* ── Title + date navigator header ── */}
      <div className="sticky top-0 z-10 bg-app-bg">
        {/* Page title & subtitle */}
        <div className="px-4 safe-top pt-0 pb-3 border-b border-app-elevated">
          <h1 className="text-[26px] font-bold text-app-text leading-tight">Log</h1>
          <p className="text-[13px] text-app-secondary mt-0.5">Catch up on the days behind you.</p>
        </div>

        {/* Date navigator — only when there are past days to log */}
        {hasAnythingToLog && <div className="px-3 pt-3 pb-3 flex items-center gap-2">

          {/* Previous day */}
          <button
            onClick={() => shiftDate(-1)}
            disabled={!canGoBack}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              canGoBack
                ? 'bg-app-elevated text-app-text active:opacity-70'
                : 'text-app-elevated cursor-default'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Tappable date label — opens native date picker */}
          <button
            className="flex-1 text-center py-1 rounded-xl active:opacity-70 transition-opacity"
            onClick={() => {
              if (dateInputRef.current?.showPicker) dateInputRef.current.showPicker()
              else dateInputRef.current?.click()
            }}
          >
            <p className="text-[16px] font-bold text-app-text leading-tight truncate">
              {formatDayLabel(viewDate)}
            </p>
          </button>

          {/* Hidden native date input — drives the jump-to-date */}
          <input
            ref={dateInputRef}
            type="date"
            min={earliestDate}
            max={yesterdayStr}
            value={viewDate}
            onChange={e => handleJumpToDate(e.target.value)}
            className="sr-only"
          />

          {/* Next day */}
          <button
            onClick={() => shiftDate(1)}
            disabled={!canGoForward}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              canGoForward
                ? 'bg-app-elevated text-app-text active:opacity-70'
                : 'text-app-elevated cursor-default'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">

        {/* Empty state — no habits at all, or all created today */}
        {!hasAnythingToLog && (
          <div className="flex flex-col items-center justify-center h-full min-h-[40vh] gap-3 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-app-surface flex items-center justify-center mb-1">
              <ListChecks className="w-6 h-6 text-app-secondary" />
            </div>
            <p className="text-[17px] font-semibold text-app-text">
              {activeHabits.length === 0 ? 'No habits yet.' : 'Nothing to catch up on.'}
            </p>
            <p className="text-[13px] text-app-secondary leading-relaxed max-w-[260px]">
              {activeHabits.length === 0
                ? 'Add a habit and Log will fill in as you go.'
                : 'Your habits just started today. Come back tomorrow and you\'ll see yesterday here.'}
            </p>
          </div>
        )}

        {/* Habit groups */}
        {hasAnythingToLog && <div className="space-y-3 pt-3">
          {['morning', 'afternoon', 'evening', 'anytime'].map(time => {
            const sh = habitsByTime[time]
            if (sh.length === 0) return null
            const TimeIcon = timeIcons[time]

            return (
              <div key={time}>
                {/* Group label */}
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <TimeIcon className="w-3 h-3 text-app-secondary" />
                  <span className="text-[11px] font-semibold text-app-secondary uppercase tracking-widest">
                    {time}
                  </span>
                </div>

                {/* Habit rows */}
                <div className="space-y-1">
                  {sh.map(habit => {
                    const isChecked = (logs[viewDate] || []).includes(habit.id)
                    const freqCtx   = getFreqContext(habit, logs, viewDate)

                    return (
                      <button
                        key={habit.id}
                        onClick={() => handleToggle(habit.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-app-surface active:bg-app-elevated transition-colors"
                      >
                        {/* Checkbox circle */}
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-app-accent border-2 border-app-accent'
                            : 'border-2 border-app-elevated'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                        </div>

                        {/* Name + freq context */}
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-[14px] font-medium transition-all ${
                            isChecked ? 'text-app-tertiary line-through' : 'text-app-text'
                          }`}>
                            {habit.name}
                          </p>
                          {freqCtx && (
                            <p className="text-[11px] text-app-secondary mt-0.5">{freqCtx}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>}
      </div>

      {/* ── Bottom nav ── */}
      <nav className="border-t border-app-elevated dark:border-white/10 bg-app-surface dark:bg-black flex items-center safe-area-inset-bottom px-2 py-3">
        <NavButton icon={Home}       active={false} onClick={() => onNavigate('today')} />
        <NavButton icon={TrendingUp} active={false} onClick={() => onNavigate('progress')} />
        <NavButton icon={PlusCircle} active={false} onClick={onAddHabit} />
        <NavButton icon={ListChecks} active={true}  onClick={() => onNavigate('log')} />
        <NavButton icon={Settings}   active={false} onClick={() => onNavigate('settings')} />
      </nav>
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
