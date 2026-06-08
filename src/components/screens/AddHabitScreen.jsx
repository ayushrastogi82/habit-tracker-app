import { useState, useRef } from 'react'
import { ChevronLeft, ChevronDown, Check, Minus, Plus, Sunrise, Sun, Moon, Leaf } from 'lucide-react'
import { brand } from '../../utils/brandVoice'
import { today } from '../../utils/dateUtils'

const timeDescriptions = {
  morning: 'Before noon',
  afternoon: 'Noon – 6 pm',
  evening: 'After 6 pm',
  anytime: 'No fixed time'
}

const timeIcons = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
  anytime: Leaf
}

export default function AddHabitScreen({
  isOpen,
  onClose,
  onAdd,
  confirmation,
  onCreateHabit
}) {
  const todayISO = today()
  const [habitName, setHabitName]           = useState('')
  const [habitTime, setHabitTime]           = useState('')
  const [startDate, setStartDate]           = useState(todayISO)
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false)
  const [frequency, setFrequency]           = useState('daily')
  const [frequencyTarget, setFrequencyTarget] = useState(1)
  const dateInputRef = useRef(null)

  if (!isOpen) return null

  const resetForm = () => {
    setHabitName('')
    setHabitTime('')
    setStartDate(todayISO)
    setMoreOptionsOpen(false)
    setFrequency('daily')
    setFrequencyTarget(1)
  }

  if (confirmation) {
    return (
      <div className="fixed inset-0 bg-app-bg z-50 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm w-full">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-app-green-surface">
            <Check className="w-8 h-8 text-app-green" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-app-text mb-2">
              {brand.addHabit.confirmation.heading(confirmation.habitName)}
            </h2>
            <p className="text-sm text-app-secondary">
              {brand.addHabit.confirmation.sub(confirmation.habitTime)}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <button
              onClick={() => { resetForm(); onAdd(true) }}
              className="w-full font-semibold py-3 px-4 rounded-xl text-sm text-white transition-opacity hover:opacity-90 bg-app-green-surface border border-app-green"
            >
              {brand.addHabit.confirmation.ctaPrimary}
            </button>
            <button
              onClick={() => onAdd(false)}
              className="w-full font-medium py-3 px-4 rounded-xl text-sm text-app-secondary bg-app-surface border border-app-elevated transition-colors"
            >
              {brand.addHabit.confirmation.ctaSecondary}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const canSubmit = habitName.trim() && habitTime
  const hint = !habitName.trim() && !habitTime
    ? brand.addHabit.hints.empty
    : !habitName.trim()
    ? brand.addHabit.hints.timeOnly
    : !habitTime
    ? brand.addHabit.hints.nameOnly
    : ''

  const maxTarget = frequency === 'weekly' ? 7 : 31

  const startDateLabel = startDate === todayISO
    ? 'Today'
    : new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="fixed inset-0 bg-app-bg z-50 flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-4 safe-top border-b border-app-elevated">
        <button onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-70 bg-app-elevated">
          <ChevronLeft className="w-5 h-5 text-app-text" />
        </button>
        <h2 className="text-[22px] font-bold text-app-text">Add a habit</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col">
        <div className="space-y-5 max-w-md mx-auto w-full">

          {/* Habit Name Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-app-secondary">
              {brand.addHabit.nameLabel}
            </label>
            <input
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              maxLength={20}
              placeholder={brand.addHabit.namePlaceholder}
              className="w-full px-4 py-3 rounded-xl text-[15px] text-app-text focus:outline-none focus:ring-1 focus:ring-app-green/50 transition-all bg-app-surface border border-app-elevated"
              style={{ caretColor: 'var(--app-green)' }}
            />
          </div>

          {/* When Grid */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-app-secondary">
              {brand.addHabit.whenLabel}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {['morning', 'afternoon', 'evening', 'anytime'].map((time) => {
                const Icon = timeIcons[time]
                const isSelected = habitTime === time
                return (
                  <button
                    key={time}
                    onClick={() => setHabitTime(time)}
                    className="py-4 px-3 rounded-xl transition-all active:scale-[0.97] text-left"
                    style={{
                      backgroundColor: isSelected ? 'var(--app-green-surface)' : 'var(--app-surface)',
                      border: `1px solid ${isSelected ? 'var(--app-green)' : 'var(--app-elevated)'}`,
                    }}
                  >
                    <div className="flex flex-col items-start gap-2">
                      <Icon
                        className="w-5 h-5"
                        style={{ color: isSelected ? 'white' : 'var(--app-text)' }}
                      />
                      <div>
                        <p className="text-[15px] font-semibold capitalize leading-snug"
                          style={{ color: isSelected ? 'white' : 'var(--app-text)' }}>
                          {time}
                        </p>
                        <p className="text-[12px] mt-0.5 capitalize"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--app-secondary)' }}>
                          {timeDescriptions[time]}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── More Options ─────────────────────────────────────────────── */}

          {/* Toggle row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-app-elevated" />
            <button
              onClick={() => setMoreOptionsOpen(o => !o)}
              className="flex items-center gap-1.5 py-1 text-[12px] font-medium text-app-secondary active:text-app-text transition-colors"
            >
              More Options
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{ transform: moreOptionsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            <div className="flex-1 h-px bg-app-elevated" />
          </div>

          {/* Expandable section */}
          <div
            className="overflow-hidden transition-all duration-300"
            style={{
              maxHeight: moreOptionsOpen ? '280px' : '0px',
              opacity: moreOptionsOpen ? 1 : 0,
            }}
          >
            <div className="space-y-4 pb-1">

              {/* Frequency toggle + stepper */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-app-secondary">
                  Frequency
                </label>
                <div className="flex items-center gap-2">
                  {/* Daily / Weekly / Monthly pills */}
                  <div className="flex gap-1.5 flex-1">
                    {['daily', 'weekly', 'monthly'].map(f => (
                      <button
                        key={f}
                        onClick={() => {
                          setFrequency(f)
                          if (f === 'daily') setFrequencyTarget(1)
                          else setFrequencyTarget(prev => Math.min(prev, f === 'weekly' ? 7 : 31))
                        }}
                        className="flex-1 py-2 rounded-xl text-[13px] font-semibold capitalize transition-all active:scale-[0.97]"
                        style={{
                          backgroundColor: frequency === f ? 'var(--app-green-surface)' : 'var(--app-surface)',
                          color: frequency === f ? 'white' : 'var(--app-secondary)',
                          border: `1px solid ${frequency === f ? 'var(--app-green)' : 'var(--app-elevated)'}`,
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Stepper — only visible for weekly / monthly */}
                  <div
                    className="flex items-center gap-1 bg-app-surface border border-app-elevated rounded-xl px-2 py-2 transition-all duration-200"
                    style={{
                      opacity: frequency === 'daily' ? 0 : 1,
                      pointerEvents: frequency === 'daily' ? 'none' : 'auto',
                      minWidth: 92,
                    }}
                  >
                    <button
                      onClick={() => setFrequencyTarget(t => Math.max(1, t - 1))}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-app-elevated text-app-secondary active:text-app-text transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[14px] font-bold text-app-text w-5 text-center flex-shrink-0">
                      {frequencyTarget}
                    </span>
                    <button
                      onClick={() => setFrequencyTarget(t => Math.min(maxTarget, t + 1))}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-app-elevated text-app-secondary active:text-app-text transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-[11px] text-app-tertiary ml-0.5 flex-shrink-0">
                      {frequency === 'weekly' ? 'x/wk' : 'x/mo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start date row */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-app-secondary">
                  Start date
                </label>
                {/* Hidden native date input */}
                <input
                  ref={dateInputRef}
                  type="date"
                  max={todayISO}
                  value={startDate}
                  onChange={e => {
                    if (e.target.value && e.target.value <= todayISO) setStartDate(e.target.value)
                  }}
                  className="sr-only"
                />
                <button
                  onClick={() => {
                    if (dateInputRef.current?.showPicker) dateInputRef.current.showPicker()
                    else dateInputRef.current?.click()
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-app-surface border border-app-elevated active:bg-app-elevated transition-colors"
                >
                  <span className="text-[14px] text-app-text">{startDateLabel}</span>
                  <span className="text-[12px] text-app-accent-dim font-medium">Change</span>
                </button>
                {startDate !== todayISO && (
                  <p className="text-[11px] text-app-tertiary text-center leading-snug">
                    Already doing this? Backdating lets the grid show your real history.
                  </p>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Bottom area — CTA only */}
        <div className="mt-auto pt-5 max-w-md mx-auto w-full space-y-2">
          <button
            onClick={() => {
              if (canSubmit) {
                onCreateHabit(habitName, habitTime, startDate, frequency, frequencyTarget)
                resetForm()
              }
            }}
            disabled={!canSubmit}
            className="w-full font-semibold py-3 px-4 rounded-xl text-[15px] transition-all active:scale-[0.98]"
            style={{
              backgroundColor: canSubmit ? 'var(--app-green-surface)' : 'var(--app-surface)',
              color:           canSubmit ? 'white'                    : 'var(--app-tertiary)',
              cursor:          canSubmit ? 'pointer'                   : 'not-allowed',
              border:          canSubmit ? '1px solid var(--app-green)' : '1px solid var(--app-elevated)',
            }}
          >
            {brand.addHabit.ctaPrimary}
          </button>

          {hint && (
            <p className="text-[12px] text-center text-app-tertiary">
              {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
