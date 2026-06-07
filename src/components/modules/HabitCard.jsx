import { Check, Droplet, Apple, Brain, BookOpen, Pill, Dumbbell, Bike, Coffee, Heart, Music, Wind, Mail, Target, Leaf } from 'lucide-react'
import { today } from '../../utils/dateUtils'
import FrequencyBadge from './FrequencyBadge'

const getHabitIcon = (habitName) => {
  const name = habitName.toLowerCase()

  if (name.includes('water') || name.includes('hydrate')) return Droplet
  if (name.includes('eat') || name.includes('breakfast') || name.includes('lunch') || name.includes('food')) return Apple
  if (name.includes('meditat')) return Brain
  if (name.includes('read') || name.includes('book')) return BookOpen
  if (name.includes('vitamin') || name.includes('pill') || name.includes('supplement')) return Pill
  if (name.includes('work') || name.includes('focus') || name.includes('deep')) return Target
  if (name.includes('stretch') || name.includes('yoga')) return Target
  if (name.includes('workout') || name.includes('exercise') || name.includes('gym')) return Dumbbell
  if (name.includes('bike') || name.includes('ride')) return Bike
  if (name.includes('coffee') || name.includes('tea')) return Coffee
  if (name.includes('heart') || name.includes('love')) return Heart
  if (name.includes('music') || name.includes('listen')) return Music
  if (name.includes('walk') || name.includes('step')) return Wind
  if (name.includes('inbox') || name.includes('email')) return Mail
  if (name.includes('journal') || name.includes('write')) return BookOpen

  return Leaf
}

export default function HabitCard({ habit, logs, onToggle, compact = false }) {
  const todayStr = today()
  const isChecked = logs[todayStr]?.includes(habit.id) ?? false
  const Icon = getHabitIcon(habit.name)

  if (compact) {
    return (
      <button
        onClick={() => onToggle(habit.id)}
        className="w-full flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
      >
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? 'text-slate-400 dark:text-slate-600' : 'text-black dark:text-white'}`} />
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-xs font-medium transition-all ${
            isChecked
              ? 'text-slate-400 dark:text-slate-600 line-through'
              : 'text-black dark:text-white'
          }`}>
            {habit.name}
          </p>
        </div>
        <div className={`flex-shrink-0 w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-all ${
          isChecked
            ? 'bg-black dark:bg-white border-black dark:border-white'
            : 'group-hover:border-black dark:group-hover:border-white'
        }`}>
          {isChecked && <Check className="w-2 h-2 text-white dark:text-black" />}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => onToggle(habit.id)}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isChecked ? 'text-slate-400 dark:text-slate-600' : 'text-black dark:text-white'}`} />
      <div className="flex-1 min-w-0 text-left">
        <p className={`font-semibold text-sm transition-all ${
          isChecked
            ? 'text-slate-400 dark:text-slate-600 line-through'
            : 'text-black dark:text-white'
        }`}>
          {habit.name}
        </p>
        {habit.frequency !== 'daily' && (
          <FrequencyBadge
            frequency={habit.frequency}
            frequencyTarget={habit.frequencyTarget}
            logs={logs}
            habitId={habit.id}
          />
        )}
      </div>
      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
        isChecked
          ? 'bg-black dark:bg-white border-black dark:border-white'
          : 'border-slate-300 dark:border-slate-700 group-hover:border-black dark:group-hover:border-white'
      }`}>
        {isChecked && <Check className="w-4 h-4 text-white dark:text-black" />}
      </div>
    </button>
  )
}
