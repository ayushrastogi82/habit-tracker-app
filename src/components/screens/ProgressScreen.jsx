import { useState, useEffect } from 'react'
import {
  Home, TrendingUp, PlusCircle, ListChecks, Settings,
  Droplet, Apple, Brain, BookOpen, Pill, Sun, Moon, Sunrise,
  Dumbbell, Bike, Coffee, Heart, Music, Wind, Mail,
  Target, Leaf, Calendar, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react'
import { today, formatDate } from '../../utils/dateUtils'
import { getTotalDaysLogged, computeRunState } from '../../utils/streakUtils'
import { getDatesInMonth, formatFrequency } from '../../utils/frequencyUtils'
import { brand } from '../../utils/brandVoice'

// ── Shared icon palette ────────────────────────────────────────────────────────
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

// ── Full-month heatmap (all habits intensity) — used by simple mode ────────────
function MonthHeatmap({ habits, logs, viewMonth }) {
  const todayStr = today()
  const dates = getDatesInMonth(viewMonth)

  const firstDate = new Date(dates[0] + 'T00:00:00')
  const startPad  = firstDate.getDay()
  const cells     = [...Array(startPad).fill(null), ...dates]

  const levelFor = (dateStr) => {
    if (!dateStr || dateStr > todayStr) return 'future'
    const done  = (logs[dateStr] || []).length
    const total = habits.length
    if (total === 0 || done === 0) return 'empty'
    const pct = done / total
    if (pct < 0.34) return 'low'
    if (pct < 0.67) return 'mid'
    return 'full'
  }

  const cellClass = { future: 'bg-app-elevated', empty: 'bg-app-elevated', low: 'bg-teal-200 dark:bg-teal-900', mid: 'bg-teal-400 dark:bg-teal-600', full: 'bg-app-accent' }

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] text-app-tertiary font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dateStr, i) => {
          const isToday = dateStr === todayStr
          const level   = levelFor(dateStr)
          return (
            <div key={i} className={`aspect-square rounded-sm ${dateStr ? cellClass[level] : 'bg-transparent'} ${isToday ? 'ring-1 ring-app-accent-dim ring-offset-1 ring-offset-[var(--app-bg)]' : ''}`} />
          )
        })}
      </div>
    </div>
  )
}

// ── Month arithmetic helper ────────────────────────────────────────────────────
// Uses the 15th to avoid month-overflow edge cases (e.g. Jan 31 + 1 month).
// Returns a YYYY-MM string.
const addMonths = (ym, delta) => {
  const d = new Date(ym + '-15T12:00:00')
  d.setMonth(d.getMonth() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── 6-month rolling contribution grid (B9) ────────────────────────────────────
// The window always spans exactly 6 calendar months.
// Default: current month pinned at the right edge (like GitHub's contribution
// graph — "now" is always on the right).
// Navigation shifts by ONE month at a time so five of six months overlap and
// older data is revealed gradually. Right arrow disabled when right edge is the
// current month. Left arrow disabled when sliding further would leave the
// habit's entire life off-screen (don't show all-empty pre-start grids).
// Months before the habit's first log render as upcoming-style (not missed).
// Cell states (B7): logged | rest-day | missed-past | upcoming/pre-habit
function SixMonthGrid({ habitId, logs, restDayDates = new Set(), onRestDayTap }) {
  const todayStr       = today()
  const currentMonthYM = todayStr.substring(0, 7)

  // windowEndMonth is the YYYY-MM of the rightmost month in the 6-month window.
  const [windowEndMonth, setWindowEndMonth] = useState(currentMonthYM)

  // First log date — determines pre-habit cell styling and left-bound check.
  const firstLogDate = Object.keys(logs)
    .filter(d => (logs[d] || []).includes(habitId))
    .sort()[0] || null
  const firstLogMonth = firstLogDate ? firstLogDate.substring(0, 7) : null

  // 6-month window: leftmost month is 5 months before windowEndMonth.
  const windowStartMonth = addMonths(windowEndMonth, -5)

  // Grid starts on the Sunday on-or-before the 1st of windowStartMonth.
  const firstOfStart = new Date(windowStartMonth + '-01T12:00:00')
  const gridStart    = new Date(firstOfStart)
  gridStart.setDate(firstOfStart.getDate() - firstOfStart.getDay())

  // Grid ends on the Saturday on-or-after the last day of windowEndMonth.
  const [endYr, endMo] = windowEndMonth.split('-').map(Number)
  const lastOfEnd  = new Date(endYr, endMo, 0) // day 0 of next month = last day
  const gridEnd    = new Date(lastOfEnd)
  gridEnd.setDate(lastOfEnd.getDate() + ((6 - lastOfEnd.getDay() + 7) % 7))

  // Build week arrays (variable column count, typically 25–27).
  const weeks  = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push(formatDate(new Date(cursor)))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  const WEEKS = weeks.length

  // Label each week by its Thursday — avoids "May" on a week that is mostly June.
  const monthSpans = []
  weeks.forEach((week) => {
    const thu   = week[3]
    const mo    = thu.substring(0, 7)
    const label = new Date(thu + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
    if (!monthSpans.length || monthSpans[monthSpans.length - 1].mo !== mo) {
      monthSpans.push({ mo, label, count: 1 })
    } else {
      monthSpans[monthSpans.length - 1].count++
    }
  })

  // Range label — "Jan – Jun 2026" or "Nov 2025 – Apr 2026" across year boundary.
  const startYr = parseInt(windowStartMonth.substring(0, 4))
  const endYr2  = parseInt(windowEndMonth.substring(0, 4))
  const fmtMo   = (ym, withYear) =>
    new Date(ym + '-15T00:00:00').toLocaleDateString('en-US',
      { month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
  const rangeLabel = startYr === endYr2
    ? `${fmtMo(windowStartMonth, false)} – ${fmtMo(windowEndMonth, true)}`
    : `${fmtMo(windowStartMonth, true)} – ${fmtMo(windowEndMonth, true)}`

  // Navigation bounds (B9).
  // Right: disabled when already showing current month at the right edge.
  const canGoForward = windowEndMonth < currentMonthYM
  // Left: disabled when sliding one more month left would put the habit's entire
  // life off the right edge of the new window (i.e. firstLogMonth > new right edge).
  const proposedRightEdge = addMonths(windowEndMonth, -1)
  const canGoBack = firstLogMonth ? firstLogMonth <= proposedRightEdge : false
  const showNav   = canGoBack || canGoForward

  // DOW label column width (px) — must match the inline style below.
  const DOW_W = 10

  return (
    <div className="space-y-1">
      {/* Navigation row — shown whenever forward or backward navigation is possible */}
      {showNav && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => canGoBack && setWindowEndMonth(m => addMonths(m, -1))}
            className={`p-0.5 rounded ${canGoBack ? 'text-app-tertiary hover:text-app-secondary active:text-app-text' : 'text-app-elevated cursor-default'}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] text-app-tertiary font-medium">{rangeLabel}</span>
          <button
            onClick={() => canGoForward && setWindowEndMonth(m => addMonths(m, 1))}
            className={`p-0.5 rounded ${canGoForward ? 'text-app-tertiary hover:text-app-secondary active:text-app-text' : 'text-app-elevated cursor-default'}`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Month labels — left-padded by DOW column so they align with grid columns */}
      <div className="flex" style={{ paddingLeft: DOW_W + 3 }}>
        {monthSpans.map(({ mo, label, count }, idx) => (
          <div
            key={mo}
            className="text-[9px] text-app-tertiary leading-none overflow-hidden"
            style={{ flex: count }}
          >
            {(count >= 2 || idx === monthSpans.length - 1) && mo >= windowStartMonth && mo <= windowEndMonth ? label : ''}
          </div>
        ))}
      </div>

      {/* DOW labels + full-width variable-column grid */}
      <div className="flex items-start" style={{ gap: 3 }}>
        {/* Day-of-week labels */}
        <div className="flex flex-col" style={{ gap: 2, width: DOW_W, flexShrink: 0 }}>
          {['S','M','T','W','T','F','S'].map((l, i) => (
            <div
              key={i}
              className="text-[7px] text-app-tertiary leading-none text-right"
              style={{ height: 9, lineHeight: '9px' }}
            >
              {i % 2 === 1 ? l : ''}
            </div>
          ))}
        </div>

        {/* repeat(WEEKS, 1fr) → columns fill the available width exactly */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
            gridTemplateRows: 'repeat(7, 9px)',
            gridAutoFlow: 'column',
            gap: '2px',
          }}
        >
          {weeks.flatMap((week, wi) =>
            week.map((dateStr, di) => {
              // Months before the habit existed are "pre-habit" — render as
              // upcoming-style, not as missed days (B9).
              const isPreHabit = firstLogDate ? dateStr < firstLogDate : false
              const isFuture   = dateStr > todayStr
              const logged     = !isFuture && !isPreHabit && (logs[dateStr] || []).includes(habitId)
              const isToday    = dateStr === todayStr
              const isRestDay  = !logged && !isFuture && !isPreHabit && !isToday && restDayDates.has(dateStr)
              // Cell colors (B7):
              //   logged          → solid teal
              //   rest day        → dark bg + centred dim-teal dot
              //   missed past     → app-cell-past
              //   future/pre-habit → app-cell-future (lighter, "upcoming" look)
              const bgColor = logged
                ? 'var(--app-accent-color)'
                : (isFuture || isPreHabit)
                ? 'var(--app-cell-future)'
                : 'var(--app-cell-past)'
              return (
                <div
                  key={`${wi}-${di}`}
                  className={`rounded-[2px] flex items-center justify-center${
                    isToday ? ' ring-1 ring-app-accent-dim ring-offset-[1px] ring-offset-[var(--app-surface)]'
                    : isRestDay ? ' cursor-pointer'
                    : ''
                  }`}
                  style={{ backgroundColor: bgColor }}
                  onClick={isRestDay && onRestDayTap ? onRestDayTap : undefined}
                >
                  {isRestDay && (
                    <div
                      className="w-[3px] h-[3px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: 'var(--app-accent-color)', opacity: 0.6 }}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ── Compact stat card for the 4-up row ────────────────────────────────────────
function MiniStatCard({ label, value }) {
  return (
    <div className="flex-1 bg-app-bg rounded-xl px-2 py-2 flex flex-col gap-1 min-w-0">
      <p className="text-[9px] text-app-tertiary leading-none truncate">{label}</p>
      <p className="text-[13px] font-bold text-app-accent-dim leading-none truncate">{value}</p>
    </div>
  )
}

// ── Reusable insight card ──────────────────────────────────────────────────────
function InsightCard({ IconComponent, bg, color, label, title, body }) {
  return (
    <div className="flex items-center gap-2.5 bg-app-surface rounded-xl px-3 py-2.5 border border-app-elevated">
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
        <IconComponent className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-app-secondary font-medium uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-[13px] font-bold text-app-text leading-snug truncate">{title}</p>
        <p className="text-[11px] text-app-secondary leading-snug truncate">{body}</p>
      </div>
    </div>
  )
}

// ── "Days showed up" copy ──────────────────────────────────────────────────────
function getDaysShowedUpCopy(days, daysInMonth, isPast) {
  if (days === 0) return isPast ? "Nothing logged that month." : "Nothing logged yet this month. That changes whenever you're ready."
  if (daysInMonth >= 14 && days >= Math.round(daysInMonth * 0.9)) return isPast ? "Almost every day. That was a strong month." : "Almost every day this month. That's rare."
  if (daysInMonth >= 7  && days >= Math.round(daysInMonth * 0.5)) return isPast ? "More than half the month. You showed up." : "More than half the month, you chose to show up."
  return `${days} ${days === 1 ? 'chance' : 'chances'} taken. That's the whole game.`
}

const dayWord = (n) => `${n} ${n === 1 ? 'day' : 'days'}`

// ── Simple mode ────────────────────────────────────────────────────────────────
function SimpleProgress({ habits, logs, viewMonth }) {
  const todayStr  = today()
  const dates     = getDatesInMonth(viewMonth)
  const pastDates = dates.filter(d => d <= todayStr)
  const isPastMonth = viewMonth.substring(0, 7) < todayStr.substring(0, 7)
  const daysInMonth = pastDates.length

  const daysShowedUp = pastDates.filter(d => (logs[d] || []).length > 0).length

  const totalPossible = habits.length * daysInMonth
  const totalDone     = pastDates.reduce((sum, d) => sum + (logs[d] || []).length, 0)
  const overallRate   = totalPossible > 0 ? totalDone / totalPossible : 0
  const isLowMonth    = overallRate < 0.3 && daysInMonth > 7

  const withCounts = habits.map(h => ({
    habit: h,
    count: pastDates.filter(d => (logs[d] || []).includes(h.id)).length
  })).sort((a, b) => b.count - a.count)

  const usedIds = new Set()
  const claim = (predicate) => {
    const match = withCounts.find(e => !usedIds.has(e.habit.id) && predicate(e))
    if (match) usedIds.add(match.habit.id)
    return match || null
  }

  const mostConsistent = claim(e => e.count > 0)
  const mostReturned   = claim(e => e.count > 0)

  const sectionLabel = isPastMonth ? 'THAT MONTH' : 'THIS MONTH'

  if (isLowMonth) {
    return (
      <div className="space-y-3">
        <MonthHeatmap habits={habits} logs={logs} viewMonth={viewMonth} />
        <p className="text-[11px] font-semibold text-app-secondary uppercase tracking-widest pt-2">{sectionLabel}</p>
        <InsightCard
          IconComponent={Calendar} bg="bg-[#1a283a]" color="text-[#4d7fd4]"
          label="Days you showed up"
          title={dayWord(daysShowedUp)}
          body="Coming back is the skill. You're still here."
        />
        {mostConsistent && (() => {
          const { Icon, bg, color } = getHabitIcon(mostConsistent.habit.name)
          return (
            <InsightCard
              IconComponent={Icon} bg={bg} color={color}
              label="Most consistent"
              title={mostConsistent.habit.name}
              body={`Showing up ${mostConsistent.count} out of ${daysInMonth} days`}
            />
          )
        })()}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <MonthHeatmap habits={habits} logs={logs} viewMonth={viewMonth} />
      <p className="text-[10px] font-semibold text-app-secondary uppercase tracking-widest pt-1 pb-0.5">{sectionLabel}</p>

      {mostConsistent && (() => {
        const { Icon, bg, color } = getHabitIcon(mostConsistent.habit.name)
        return (
          <InsightCard
            IconComponent={Icon} bg={bg} color={color}
            label="Most consistent"
            title={mostConsistent.habit.name}
            body={`${mostConsistent.count} of ${daysInMonth} days`}
          />
        )
      })()}

      {mostReturned && (() => {
        const { Icon, bg, color } = getHabitIcon(mostReturned.habit.name)
        return (
          <InsightCard
            IconComponent={Icon} bg={bg} color={color}
            label="Most returned to"
            title={mostReturned.habit.name}
            body="Keep coming back to this one"
          />
        )
      })()}

      <InsightCard
        IconComponent={Calendar} bg="bg-[#1a283a]" color="text-[#4d7fd4]"
        label="Days showed up"
        title={`${dayWord(daysShowedUp)}${isPastMonth ? '' : ' this month'}`}
        body={getDaysShowedUpCopy(daysShowedUp, daysInMonth, isPastMonth)}
      />
    </div>
  )
}

// ── Detailed helpers ───────────────────────────────────────────────────────────

const countInRange = (habitId, logs, start, end) => {
  const t = today()
  const cap = end > t ? t : end
  return Object.keys(logs).filter(d => d >= start && d <= cap && (logs[d] || []).includes(habitId)).length
}

// ── Weekly frequency helpers ───────────────────────────────────────────────────
const getTotalWeeksLogged = (habitId, logs, target) => {
  const allDates = Object.keys(logs).filter(d => (logs[d] || []).includes(habitId))
  if (!allDates.length) return 0
  const weekSet = new Set()
  for (const d of allDates) {
    const date = new Date(d + 'T12:00:00') // noon — DST-safe
    const sun  = new Date(date)
    sun.setDate(date.getDate() - date.getDay())
    weekSet.add(formatDate(sun)) // formatDate uses local time, not UTC
  }
  let total = 0
  for (const ws of weekSet) {
    const sat = new Date(ws + 'T12:00:00')
    sat.setDate(sat.getDate() + 6)
    const we = formatDate(sat)
    // Never skip the current week — countInRange already caps end at today
    if (countInRange(habitId, logs, ws, we) >= target) total++
  }
  return total
}

const getBestWeeklyRun = (habitId, logs, target) => {
  const todayStr   = today()
  const d          = new Date(todayStr + 'T12:00:00')
  const currentSun = new Date(d)
  currentSun.setDate(d.getDate() - d.getDay())
  let best = 0, run = 0
  for (let i = 51; i >= 0; i--) {
    const sun = new Date(currentSun)
    sun.setDate(currentSun.getDate() - i * 7)
    const sat = new Date(sun); sat.setDate(sun.getDate() + 6)
    const start = formatDate(sun), end = formatDate(sat)
    if (start > todayStr) continue // skip weeks that haven't started yet
    // Never skip the current week — countInRange already caps end at today
    if (countInRange(habitId, logs, start, end) >= target) { run++; best = Math.max(best, run) }
    else run = 0
  }
  return best
}

const getWeeksInMonthHit = (habitId, logs, target) => {
  const todayStr   = today()
  const prefix     = todayStr.substring(0, 7)
  const monthStart = prefix + '-01'
  const d = new Date(monthStart + 'T12:00:00')
  const cursor = new Date(d)
  cursor.setDate(d.getDate() - d.getDay())
  let count = 0
  while (true) {
    const sunStr = formatDate(cursor)
    const sat = new Date(cursor); sat.setDate(cursor.getDate() + 6)
    const satStr = formatDate(sat)
    if (sunStr.substring(0, 7) > prefix && satStr.substring(0, 7) > prefix) break
    if (sunStr > todayStr) break
    if (countInRange(habitId, logs, sunStr, satStr) >= target) count++
    cursor.setDate(cursor.getDate() + 7)
  }
  return count
}

// ── Monthly frequency helpers ──────────────────────────────────────────────────
const getTotalMonthsLogged = (habitId, logs, target) => {
  const allDates = Object.keys(logs).filter(d => (logs[d] || []).includes(habitId))
  if (!allDates.length) return 0
  const monthSet = new Set(allDates.map(d => d.substring(0, 7)))
  let total = 0
  for (const mo of monthSet) {
    if (countInRange(habitId, logs, mo + '-01', mo + '-31') >= target) total++
  }
  return total
}

const getBestMonthlyRun = (habitId, logs, target) => {
  const allDates = Object.keys(logs).filter(d => (logs[d] || []).includes(habitId)).sort()
  if (!allDates.length) return 0
  const months = [...new Set(allDates.map(d => d.substring(0, 7)))].sort()
  let best = 0, run = 0, prevMo = null
  for (const mo of months) {
    if (countInRange(habitId, logs, mo + '-01', mo + '-31') >= target) {
      if (prevMo) {
        const next = new Date(prevMo + '-01T12:00:00')
        next.setMonth(next.getMonth() + 1)
        run = formatDate(next).substring(0, 7) === mo ? run + 1 : 1
      } else {
        run = 1
      }
      best = Math.max(best, run)
      prevMo = mo
    } else {
      run = 0
      prevMo = mo
    }
  }
  return best
}

const getLast12Weeks = () => {
  const t = today()
  const d = new Date(t + 'T00:00:00')
  const currentSun = new Date(d)
  currentSun.setDate(d.getDate() - d.getDay())
  const fmt = x => formatDate(x)
  return Array.from({ length: 12 }, (_, i) => {
    const sun = new Date(currentSun)
    sun.setDate(currentSun.getDate() - (11 - i) * 7)
    const sat = new Date(sun)
    sat.setDate(sun.getDate() + 6)
    return { start: fmt(sun), end: fmt(sat) }
  })
}

const getLast12Months = () => {
  const t = today()
  const d = new Date(t + 'T00:00:00')
  const fmt = x => formatDate(x)
  return Array.from({ length: 12 }, (_, i) => {
    const m = new Date(d.getFullYear(), d.getMonth() - (11 - i), 1)
    return fmt(m)
  })
}

const getCurrentWeekRange = () => {
  const t = today()
  const d = new Date(t + 'T00:00:00')
  const sun = new Date(d)
  sun.setDate(d.getDate() - d.getDay())
  const sat = new Date(sun)
  sat.setDate(sun.getDate() + 6)
  const fmt = x => formatDate(x)
  return { start: fmt(sun), end: fmt(sat) }
}

const getLast7 = () => {
  const todayStr = today()
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStr + 'T00:00:00')
    d.setDate(d.getDate() - i)
    out.push(formatDate(d))
  }
  return out
}

const daysSinceLogged = (habitId, logs) => {
  const todayStr = today()
  const sortedDates = Object.keys(logs)
    .filter(d => (logs[d] || []).includes(habitId))
    .sort()
    .reverse()
  if (!sortedDates.length) return null
  const last = sortedDates[0]
  return Math.floor(
    (new Date(todayStr + 'T00:00:00') - new Date(last + 'T00:00:00')) / 86400000
  )
}

const timeAgo = (isoDate) => {
  if (!isoDate) return null
  const d = new Date(isoDate)
  const now = new Date()
  const days = Math.floor((now - d) / 86400000)
  if (days < 7)  return `${days} ${days === 1 ? 'day' : 'days'} ago`
  if (days < 30) return `${Math.floor(days / 7)} ${Math.floor(days / 7) === 1 ? 'week' : 'weeks'} ago`
  const months = Math.floor(days / 30)
  return `${months} ${months === 1 ? 'month' : 'months'} ago`
}

// "this wk" if started in the current Sun–Sat week, then "1wk ago", "2wk ago", …
// Uses Sunday-boundary crossings so "last week" always reads "1wk ago" even if
// only 1–6 days have passed (avoids the floor(days/7)=0 bug).
const timeAgoWeeks = (isoDate) => {
  if (!isoDate) return 'this wk'
  const todayStr   = today()
  const todayDate  = new Date(todayStr + 'T12:00:00')
  const currentSun = new Date(todayDate)
  currentSun.setDate(todayDate.getDate() - todayDate.getDay())
  const weekStart  = formatDate(currentSun)

  if (isoDate >= weekStart) return 'this wk'

  // Count Sunday-to-Sunday boundaries between the start week and this week
  const startDate = new Date(isoDate + 'T12:00:00')
  const startSun  = new Date(startDate)
  startSun.setDate(startDate.getDate() - startDate.getDay())

  const weeksAgo = Math.round((currentSun - startSun) / (7 * 86400000))
  if (weeksAgo < 52) return `${weeksAgo}wk ago`
  return `${Math.floor(weeksAgo / 52)}yr ago`
}

// "this mo" if started in the current calendar month, then "1mo ago", "2mo ago", …
const timeAgoMonths = (isoDate) => {
  const todayStr  = today()
  const thisMonth = todayStr.substring(0, 7) // "YYYY-MM"

  if (!isoDate || isoDate.substring(0, 7) >= thisMonth) return 'this mo'

  const d1    = new Date(isoDate   + 'T12:00:00')
  const d2    = new Date(todayStr  + 'T12:00:00')
  const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}yr ago`
}

// Alias kept for any remaining callers
const timeAgoCompact = timeAgoWeeks

// ── Single habit card ──────────────────────────────────────────────────────────
function HabitDetailCard({ habit, logs }) {
  const storageKey = `beacon-progress-card-${habit.id}`
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'true' }
    catch { return false }
  })

  // Persist each card's open/close state across navigations and app restarts
  useEffect(() => {
    localStorage.setItem(storageKey, expanded ? 'true' : 'false')
  }, [expanded, storageKey])

  // Rest-day-cell tap note — shows explanation for 3 s when a rest-day cell is tapped
  const [showRestDayNote, setShowRestDayNote] = useState(false)
  useEffect(() => {
    if (!showRestDayNote) return
    const t = setTimeout(() => setShowRestDayNote(false), 3000)
    return () => clearTimeout(t)
  }, [showRestDayNote])
  const handleRestDayTap = () => setShowRestDayNote(true)

  const { Icon, bg, color } = getHabitIcon(habit.name)

  const todayStr = today()
  const freq     = habit.frequency || 'daily'
  const target   = habit.frequencyTarget || 1
  const last7    = getLast7()

  // First actual log date — more meaningful than createdAt for "Started" display.
  // createdAt is when the habit was added; firstLogDate is when tracking really began.
  const firstLogDate = Object.keys(logs)
    .filter(d => (logs[d] || []).includes(habit.id))
    .sort()[0] || null

  const totalDays    = getTotalDaysLogged(habit.id, logs)
  const runState     = freq === 'daily' ? computeRunState(habit.id, logs) : null
  const currentRun   = runState?.currentRun ?? 0
  const bestRun      = runState?.bestRun ?? 0
  const restDayDates = runState?.restDayDates ?? new Set()

  // This-month count
  const prefix         = todayStr.substring(0, 7)
  const thisMonthCount = Object.keys(logs).filter(
    d => d.startsWith(prefix) && (logs[d] || []).includes(habit.id)
  ).length

  // Frequency + time label
  const freqLineFull = (() => {
    const f = freq === 'daily' ? 'Daily'
      : freq === 'weekly'  ? `${target}x week`
      : target === 1 ? 'Monthly' : `${target}x month`
    return `${f} · ${habit.time || 'anytime'}`
  })()

  // Consecutive-week run
  const getWeeklyRun = () => {
    const weeks = getLast12Weeks()
    let run = 0
    for (let i = weeks.length - 1; i >= 0; i--) {
      const { start, end } = weeks[i]
      if (start > todayStr) continue
      if (countInRange(habit.id, logs, start, end) >= target) {
        run++ // target met this week (counts even if week still in progress)
      } else if (end >= todayStr) {
        continue // current week still in progress, target not yet met — don't break
      } else {
        break // past week missed — run over
      }
    }
    return run
  }
  const getWeeksAway = () => {
    const weeks = getLast12Weeks()
    let away = 0
    for (let i = weeks.length - 1; i >= 0; i--) {
      const { start, end } = weeks[i]
      if (start > todayStr) continue
      if (end >= todayStr) continue // skip current in-progress week
      if (countInRange(habit.id, logs, start, end) === 0) away++
      else break
    }
    return away
  }

  // Consecutive-month run
  const getMonthlyRun = () => {
    const months = getLast12Months()
    let run = 0
    for (let i = months.length - 1; i >= 0; i--) {
      const ms = months[i]
      if (ms > todayStr) continue
      const monthEnd = ms.substring(0, 7) + '-31'
      if (countInRange(habit.id, logs, ms, monthEnd) >= target) {
        run++ // target met this month (counts even if month still in progress)
      } else if (monthEnd >= todayStr) {
        continue // current month still in progress — don't break
      } else {
        break // past month missed — run over
      }
    }
    return run
  }

  // Status line for header
  let statusText = ''
  let statusTeal = false

  if (freq === 'daily') {
    if (currentRun > 0) {
      statusText = `On a run — ${currentRun} ${currentRun === 1 ? 'day' : 'days'}`
      statusTeal = true
    } else if (runState.totalEver === 0) {
      statusText = 'Not started yet'
    } else {
      // Run is broken — show factual away count in muted text (no sentiment, today excluded).
      // missedCompletedDays is 0 when the rest-day cushion absorbed the miss (run intact).
      statusText = runState.missedCompletedDays > 0
        ? `Away — ${runState.missedCompletedDays} ${runState.missedCompletedDays === 1 ? 'day' : 'days'}`
        : ''
    }
  } else if (freq === 'weekly') {
    const weekRun   = getWeeklyRun()
    const weeksAway = getWeeksAway()
    const { start, end } = getCurrentWeekRange()
    const thisWeek  = countInRange(habit.id, logs, start, end)
    if (weekRun > 0) {
      statusText = `On a run — ${weekRun} ${weekRun === 1 ? 'wk' : 'wks'}`
      statusTeal = true
    } else if (thisWeek > 0) {
      statusText = `${thisWeek} of ${target} this week`
    } else if (weeksAway > 0) {
      statusText = '' // gap visible in grid; no narration of absence (B6)
    } else {
      statusText = 'Nothing logged yet'
    }
  } else {
    const monthRun  = getMonthlyRun()
    const thisMonth = countInRange(habit.id, logs, prefix + '-01', prefix + '-31')
    if (monthRun > 0) {
      // monthRun already counts this month if target is met, or prior months otherwise
      statusText = `On a run — ${monthRun} ${monthRun === 1 ? 'month' : 'months'}`
      statusTeal = true
    } else if (thisMonth > 0) {
      statusText = `${thisMonth} of ${target} this month`
    } else {
      statusText = 'Not yet this month'
    }
  }

  // Sub-card values — frequency-aware units
  let thisMonthValue, totalEverValue, bestRunValue, startedValue
  if (freq === 'daily') {
    thisMonthValue = `${thisMonthCount}d`
    totalEverValue = `${totalDays}d`
    bestRunValue   = bestRun > 0 ? `${bestRun}d` : '—'
  } else if (freq === 'weekly') {
    const mWks = getWeeksInMonthHit(habit.id, logs, target)
    const tWks = getTotalWeeksLogged(habit.id, logs, target)
    const bWks = getBestWeeklyRun(habit.id, logs, target)
    thisMonthValue = `${mWks}wk`
    totalEverValue = `${tWks}wk`
    bestRunValue   = bWks > 0 ? `${bWks}wk` : '—'
  } else {
    // Count how many months this calendar year the habit met its target
    const thisYear = new Date().getFullYear()
    const currentMonthIdx = new Date().getMonth() // 0-based
    let yearCount = 0
    for (let m = 0; m <= currentMonthIdx; m++) {
      const mo = `${thisYear}-${String(m + 1).padStart(2, '0')}`
      if (countInRange(habit.id, logs, mo + '-01', mo + '-31') >= target) yearCount++
    }
    const tMo = getTotalMonthsLogged(habit.id, logs, target)
    const bMo = getBestMonthlyRun(habit.id, logs, target)
    thisMonthValue = `${yearCount}mo`
    totalEverValue = `${tMo}mo`
    bestRunValue   = bMo > 0 ? `${bMo}mo` : '—'

    // Started: compute raw calendar-month distance, then clamp up to tMo.
    // If you've logged 2 months total you must have started at least 2 months ago.
    if (firstLogDate) {
      const d1 = new Date(firstLogDate + 'T12:00:00')
      const d2 = new Date(todayStr + 'T12:00:00')
      let rawMonths = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
      rawMonths = Math.max(rawMonths, tMo)
      if (rawMonths === 0)       startedValue = 'this mo'
      else if (rawMonths < 12)   startedValue = `${rawMonths}mo ago`
      else                       startedValue = `${Math.floor(rawMonths / 12)}yr ago`
    } else {
      startedValue = '—'
    }
  }

  // Motivational line
  const habitAgeDays = habit.createdAt
    ? Math.floor((new Date() - new Date(habit.createdAt + 'T00:00:00')) / 86400000)
    : 999
  const isJustStarted = totalDays < 5 && habitAgeDays < 14

  // C2 — one quiet line under the grid
  // on_a_run takes top priority — a new habit that's already running should never
  // see "just_started" when "Still going." is more accurate.
  let motivLine
  if (statusTeal) {
    motivLine = brand.moments.progress_line.on_a_run
  } else if (totalDays === 0 || isJustStarted) {
    motivLine = brand.moments.progress_line.just_started
  } else if (totalDays >= 30 && currentRun === 0) {
    motivLine = brand.moments.progress_line.long_history
  } else {
    motivLine = brand.moments.progress_line.away
  }

  return (
    <div className="bg-app-surface rounded-2xl border border-app-elevated overflow-hidden">
      {/* ── Header ── */}
      <button
        className="w-full flex items-center gap-2 px-3 pt-3 pb-2"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-app-text text-[14px] leading-snug truncate">{habit.name}</p>
          <p className="text-[11px] text-app-secondary mt-0.5">{freqLineFull}</p>
          <p className={`text-[11px] mt-0.5 font-medium ${statusTeal ? 'text-app-accent-dim' : 'text-app-secondary'}`}>
            {statusText}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-app-secondary flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Mini bar (last 7 days) — 4 cell states (B7) ── */}
      <div className="flex gap-1 px-3 pb-1">
        {last7.map(d => {
          const logged      = (logs[d] || []).includes(habit.id)
          const isToday     = d === todayStr
          const isRestDay   = !logged && !isToday && restDayDates.has(d)
          // States (B7):
          //   logged        → solid teal
          //   rest day      → dark + centered dim-teal dot (NOT a plain outline — collision rule:
          //                   today/not-yet already uses the teal outline)
          //   today/not-yet → teal outline (existing)
          //   missed/other  → dark
          return (
            <div
              key={d}
              className={`flex-1 h-2 rounded-full flex items-center justify-center${
                isToday && !logged ? ' ring-1 ring-app-accent-dim' : ''
              }${isRestDay ? ' cursor-pointer' : ''}`}
              style={{ backgroundColor: logged ? 'var(--app-accent-color)' : 'var(--app-elevated)' }}
              onClick={isRestDay ? handleRestDayTap : undefined}
            >
              {isRestDay && (
                <div
                  className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'var(--app-accent-color)', opacity: 0.55 }}
                />
              )}
            </div>
          )
        })}
      </div>
      {/* Rest-day tap note — appears for 3 s when any rest-day cell is tapped */}
      <div className={`px-3 overflow-hidden transition-all duration-300 ${showRestDayNote ? 'max-h-20 pb-2' : 'max-h-0 pb-0'}`}>
        <p className="text-[11px] text-app-accent-dim/60 leading-snug">Rest day. Show up regularly and the occasional off day won't break your run.</p>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="px-3 pb-4 pt-3 border-t border-app-elevated space-y-3">
          {/* 4 sub-cards */}
          <div className="flex gap-1.5">
            <MiniStatCard label={freq === 'monthly' ? 'This year' : 'This month'} value={thisMonthValue} />
            <MiniStatCard label="Total ever" value={totalEverValue} />
            <MiniStatCard label="Started"    value={
              freq === 'monthly'
                ? (startedValue ?? '—')
                : !firstLogDate ? '—'
                : timeAgoWeeks(firstLogDate)
            } />
            <MiniStatCard label="Best run"   value={bestRunValue} />
          </div>

          {/* 6-month grid */}
          <SixMonthGrid habitId={habit.id} logs={logs} restDayDates={restDayDates} onRestDayTap={handleRestDayTap} />

          {/* Motivational line */}
          <p className="text-[12px] text-app-secondary text-center italic">{motivLine}</p>
        </div>
      )}
    </div>
  )
}

// ── Detailed mode ──────────────────────────────────────────────────────────────
function DetailedProgress({ habits, logs }) {
  if (habits.length === 0) {
    return (
      <p className="text-app-secondary text-sm text-center py-8 px-4">
        No habits to show yet.
      </p>
    )
  }

  const daily   = habits.filter(h => (h.frequency || 'daily') === 'daily')
  const weekly  = habits.filter(h => h.frequency === 'weekly')
  const monthly = habits.filter(h => h.frequency === 'monthly')

  const renderGroup = (label, groupHabits) => {
    if (groupHabits.length === 0) return null
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-app-tertiary uppercase tracking-widest px-1">
          {label}
        </p>
        {groupHabits.map(habit => (
          <HabitDetailCard key={habit.id} habit={habit} logs={logs} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {renderGroup('DAILY HABITS', daily)}
      {renderGroup('WEEKLY HABITS', weekly)}
      {renderGroup('MONTHLY HABITS', monthly)}
    </div>
  )
}

// ── Month navigator helpers ────────────────────────────────────────────────────
const currentMonthStr = () => {
  const t = today()
  return t.substring(0, 8) + '01'
}

const shiftMonth = (monthStr, delta) => {
  const d = new Date(monthStr + 'T00:00:00')
  d.setMonth(d.getMonth() + delta)
  return formatDate(d)
}

const monthDisplayLabel = (monthStr) =>
  new Date(monthStr + 'T00:00:00')
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase()

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function ProgressScreen({ habits, logs, onNavigate, onAddHabit }) {
  // Simple mode is hidden for now — always show detailed view.
  // To re-enable the toggle, restore the useState('detailed') + toggle UI below.
  const activeHabits = habits.filter(h => !h.archived)

  return (
    <div className="h-screen flex flex-col bg-app-bg">
      <div className="sticky top-0 z-10 bg-app-bg px-4 safe-top pb-3 border-b border-app-elevated">
        <h1 className="text-[26px] font-bold text-app-text leading-tight">Progress</h1>
        <p className="text-[13px] text-app-secondary mt-0.5">The shape of your showing up.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
        {activeHabits.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-app-secondary text-sm text-center px-6">{brand.emptyStates.progressNoData}</p>
          </div>
        ) : (
          <DetailedProgress habits={activeHabits} logs={logs} />
        )}
      </div>

      <nav className="border-t border-app-elevated dark:border-white/10 bg-app-surface dark:bg-black flex items-center safe-area-inset-bottom px-2 py-3">
        <NavButton icon={Home}       active={false} onClick={() => onNavigate('today')} />
        <NavButton icon={TrendingUp} active={true}  onClick={() => onNavigate('progress')} />
        <NavButton icon={PlusCircle} active={false} onClick={onAddHabit} />
        <NavButton icon={ListChecks} active={false} onClick={() => onNavigate('log')} />
        <NavButton icon={Settings}   active={false} onClick={() => onNavigate('settings')} />
      </nav>
    </div>
  )
}

function NavButton({ icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center py-1 transition-colors ${
        active ? 'text-app-text' : 'text-app-secondary hover:text-app-text'
      }`}>
      <Icon className="w-7 h-7" style={{ minWidth: 28, minHeight: 28 }} strokeWidth={2} />
    </button>
  )
}
