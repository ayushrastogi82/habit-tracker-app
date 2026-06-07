import { useState } from 'react'
import { ChevronLeft, Check, Sunrise, Sun, Moon, Leaf } from 'lucide-react'
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
  const [showDatePicker, setShowDatePicker] = useState(false)

  if (!isOpen) return null

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
              onClick={() => { setHabitName(''); setHabitTime(''); onAdd(true) }}
              className="w-full font-semibold py-3 px-4 rounded-xl text-sm text-app-text transition-opacity hover:opacity-90 bg-app-green-surface border border-app-green"
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
                        style={{ color: isSelected ? 'var(--app-green)' : 'var(--app-text)' }}
                      />
                      <div>
                        <p className="text-[15px] font-semibold text-app-text capitalize leading-snug">
                          {time}
                        </p>
                        <p className="text-[12px] mt-0.5 capitalize"
                          style={{ color: isSelected ? 'var(--app-green)' : 'var(--app-secondary)' }}>
                          {timeDescriptions[time]}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom area */}
        <div className="mt-auto pt-5 max-w-md mx-auto w-full space-y-2">

          {/* Start date line */}
          <div className="text-center pb-1">
            {startDate === todayISO ? (
              <button
                type="button"
                onClick={() => setShowDatePicker(p => !p)}
                className="text-[12px] transition-opacity hover:opacity-80"
              >
                <span className="text-app-secondary">Already doing this? · </span>
                <span className="underline underline-offset-2 text-app-text">
                  Change start date
                </span>
              </button>
            ) : (
              <span className="text-[12px] text-app-secondary">
                Started {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}
                <button
                  type="button"
                  onClick={() => setShowDatePicker(p => !p)}
                  className="underline underline-offset-2 text-app-text"
                >
                  change
                </button>
              </span>
            )}
          </div>

          {showDatePicker && (
            <div className="space-y-1">
              <input
                type="text"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                onBlur={() => {
                  const parsed = new Date(startDate + 'T00:00:00')
                  if (isNaN(parsed.getTime()) || startDate > todayISO) setStartDate(todayISO)
                  setShowDatePicker(false)
                }}
                placeholder="YYYY-MM-DD"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl text-app-text text-sm focus:outline-none focus:ring-1 focus:ring-app-green/50 bg-app-surface border border-app-elevated"
              />
              <p className="text-[11px] text-center text-app-tertiary">
                Format: YYYY-MM-DD · tap away to confirm
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => {
              if (canSubmit) {
                onCreateHabit(habitName, habitTime, startDate)
                setHabitName('')
                setHabitTime('')
                setStartDate(todayISO)
                setShowDatePicker(false)
              }
            }}
            disabled={!canSubmit}
            className="w-full font-semibold py-3 px-4 rounded-xl text-[15px] transition-all active:scale-[0.98]"
            style={{
              backgroundColor: canSubmit ? 'var(--app-green-surface)' : 'var(--app-surface)',
              color:           canSubmit ? 'var(--app-text)'         : 'var(--app-tertiary)',
              cursor:          canSubmit ? 'pointer'                  : 'not-allowed',
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
