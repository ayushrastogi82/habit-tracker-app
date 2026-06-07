export default function ConfirmModal({
  isOpen,
  title,
  description,
  primaryLabel,
  primaryVariant = 'danger',
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50">
      <div className="w-full bg-app-surface border-t border-app-elevated rounded-t-2xl p-6 space-y-4">
        <div>
          <h2 className="text-[17px] font-semibold text-app-text mb-1.5">{title}</h2>
          {description && (
            <p className="text-[14px] text-app-secondary leading-relaxed">{description}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => { onPrimary(); onClose() }}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-[15px] transition-colors ${
              primaryVariant === 'danger'
                ? 'bg-app-red/15 text-app-red border border-app-red/30'
                : 'bg-app-green-surface border border-app-green text-app-text'
            }`}
          >
            {primaryLabel}
          </button>

          {secondaryLabel && (
            <button
              onClick={() => { onSecondary?.(); onClose() }}
              className="w-full py-3 px-4 rounded-xl font-medium text-[15px] text-app-secondary bg-app-elevated hover:opacity-80 transition-opacity"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
