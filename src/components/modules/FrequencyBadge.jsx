import { formatFrequency, getFrequencyWithProgress } from '../../utils/frequencyUtils'

export default function FrequencyBadge({ frequency, frequencyTarget, logs, habitId, showProgress = true }) {
  const display = showProgress
    ? getFrequencyWithProgress(frequency, frequencyTarget, logs, habitId)
    : formatFrequency(frequency, frequencyTarget)

  return (
    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
      {display}
    </span>
  )
}
