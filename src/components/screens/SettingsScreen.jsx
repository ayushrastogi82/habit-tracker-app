import { useState, useRef, useEffect } from 'react'
import {
  User, ListChecks, Plus, PlusCircle, Palette, Download, Upload,
  Trash2, Info, Lock, ChevronRight, Home, TrendingUp, Settings as SettingsIcon,
  X, Check, AlertCircle
} from 'lucide-react'
import { exportBackup, importBackup, setUserProfile } from '../../utils/storageUtils'
import ConfirmModal from '../modules/ConfirmModal'
import BeaconMark from '../modules/BeaconMark'

// ── Reusable row ───────────────────────────────────────────────────────────────
function Row({ icon: Icon, iconBg, iconColor, title, subtitle, value, onPress, danger, disabled, toggle, toggleOn, onToggle, isLabel }) {
  const inner = (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${disabled ? 'opacity-35' : ''}`}>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-medium leading-snug ${danger ? 'text-red-500' : 'text-app-text'}`}>{title}</p>
        {subtitle && <p className="text-[12px] text-app-secondary mt-0.5">{subtitle}</p>}
      </div>
      {value && <span className="text-[14px] text-app-secondary flex-shrink-0 mr-1">{value}</span>}
      {toggle !== undefined && (
        <button
          onClick={e => { e.stopPropagation(); if (!disabled) onToggle?.(!toggleOn) }}
          className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${toggleOn ? 'bg-app-accent' : 'bg-app-elevated'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${toggleOn ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      )}
      {onPress && toggle === undefined && (
        <ChevronRight className="w-4 h-4 text-app-tertiary flex-shrink-0" />
      )}
    </div>
  )

  if (isLabel) return <div>{inner}</div>
  if (onPress) return (
    <button onClick={onPress} className="w-full text-left hover:bg-app-elevated/40 transition-colors active:bg-app-elevated">
      {inner}
    </button>
  )
  return <div>{inner}</div>
}

// ── Section card ───────────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-app-secondary uppercase tracking-widest px-1 mb-2">{label}</p>
      <div className="bg-app-surface rounded-2xl overflow-hidden border border-app-elevated divide-y divide-app-elevated">
        {children}
      </div>
    </div>
  )
}

export default function SettingsScreen({ userProfile, onUpdateProfile, theme, onThemeChange, onNavigate, onDeleteAll, colorScheme, onColorSchemeChange, onAddHabit, onImportData }) {
  const [deleteModal, setDeleteModal] = useState(false)
  const [restoreModal, setRestoreModal] = useState(null) // { file, habitsCount, dateStr }
  const [toast, setToast] = useState(null) // { type: 'success'|'error', message }
  const toastTimerRef = useRef(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(userProfile.name || '')
  const fileInputRef = useRef(null)

  const showToast = (type, message) => {
    clearTimeout(toastTimerRef.current)
    setToast({ type, message })
    toastTimerRef.current = setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  const themeLabel = theme
    ? theme.charAt(0).toUpperCase() + theme.slice(1)
    : 'System'

  const cycleTheme = () => {
    const opts = ['system', 'light', 'dark']
    const next = opts[(opts.indexOf(theme) + 1) % opts.length]
    onThemeChange(next)
  }

  const colorSchemeLabels = {
    '1': 'Slate + Teal',
    '2': 'Charcoal + Cyan',
    '3': 'Navy + Gold',
    '4': 'Midnight Iris',
  }

  const cycleColorScheme = () => {
    const opts = ['1', '2', '3', '4']
    const next = opts[(opts.indexOf(colorScheme) + 1) % opts.length]
    onColorSchemeChange(next)
  }

  const saveName = () => {
    if (nameInput.trim()) {
      const updated = { ...userProfile, name: nameInput.trim() }
      setUserProfile(updated)
      onUpdateProfile(updated)
    }
    setEditingName(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be re-selected after an error
    e.target.value = ''

    // Parse preview info (count + saved date) before showing confirm modal
    try {
      const text = await file.text()
      const raw = JSON.parse(text)

      let habitsCount = 0
      let dateStr = null

      if (Array.isArray(raw)) {
        habitsCount = raw.length
      } else if (raw && Array.isArray(raw.habits)) {
        habitsCount = raw.habits.length
        if (raw.exportedAt) {
          const d = new Date(raw.exportedAt)
          dateStr = d.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
          })
        }
      } else {
        throw new Error('Unrecognised backup format. Expected a Beacon backup JSON or the legacy habits array.')
      }

      setRestoreModal({ file, habitsCount, dateStr })
    } catch (err) {
      alert(
        'Could not read that file.\n\n' +
        'Make sure it is a Beacon backup (.json) or the exported file from the original habit tracker.\n\n' +
        'Details: ' + err.message
      )
    }
  }

  const confirmRestore = async () => {
    if (!restoreModal) return
    const { file } = restoreModal
    setRestoreModal(null)
    try {
      const imported = await importBackup(file)
      // Update React state directly — no page reload needed.
      // A reload caused iOS PWA to restore the suspended JS context
      // instead of re-reading localStorage, so habits appeared lost.
      onImportData(imported) // MainApp shows success toast + navigates to today
    } catch (err) {
      showToast('error', err.message || 'Could not restore backup.')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-app-bg">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-app-bg px-4 safe-top pb-3 border-b border-app-elevated">
        <h1 className="text-[26px] font-bold text-app-text leading-tight">Settings</h1>
        <p className="text-[13px] text-app-secondary mt-0.5">Make Beacon yours.</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* PROFILE */}
        <Section label="PROFILE">
          <div>
            <Row
              icon={User} iconBg="bg-app-accent/20" iconColor="text-app-accent-dim"
              title="Your name"
              subtitle={userProfile.name || 'Set your name'}
              onPress={() => { setNameInput(userProfile.name || ''); setEditingName(true) }}
            />
            {editingName && (
              <div className="px-4 pb-4 flex gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  maxLength={20}
                  className="flex-1 px-3 py-2 rounded-xl bg-app-surface border border-app-elevated text-app-text text-[14px] focus:outline-none focus:border-app-accent"
                  placeholder="Your name"
                />
                <button onClick={saveName}
                  className="w-9 h-9 rounded-xl bg-app-accent flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => setEditingName(false)}
                  className="w-9 h-9 rounded-xl bg-app-elevated flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-app-secondary" />
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* HABITS */}
        <Section label="HABITS">
          <Row
            icon={ListChecks} iconBg="bg-purple-500/20" iconColor="text-purple-400"
            title="Manage habits"
            subtitle="Edit, reorder, archive"
            onPress={() => onNavigate('manage')}
          />
          <Row
            icon={Plus} iconBg="bg-app-accent/20" iconColor="text-app-accent-dim"
            title="Add a habit"
            subtitle="Start tracking something new"
            onPress={onAddHabit}
          />
        </Section>

        {/* APPEARANCE */}
        <Section label="APPEARANCE">
          <Row
            icon={Palette} iconBg="bg-indigo-500/20" iconColor="text-indigo-400"
            title="Theme"
            value={themeLabel}
            onPress={cycleTheme}
          />
          <Row
            icon={Palette} iconBg="bg-violet-500/20" iconColor="text-violet-400"
            title="Color scheme"
            value={colorSchemeLabels[colorScheme] || 'Default'}
            onPress={cycleColorScheme}
          />
        </Section>

        {/* DATA */}
        <Section label="DATA">
          <Row
            icon={Download} iconBg="bg-app-accent/20" iconColor="text-app-accent-dim"
            title="Download backup"
            subtitle="Save your progress to device"
            onPress={() => exportBackup()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Row
            icon={Upload} iconBg="bg-app-accent/20" iconColor="text-app-accent-dim"
            title="Upload backup"
            subtitle="Restore from a saved file"
            onPress={() => fileInputRef.current?.click()}
          />
          <Row
            icon={Trash2} iconBg="bg-red-500/20" iconColor="text-red-500"
            title="Delete all data"
            subtitle="Removes everything permanently"
            danger onPress={() => setDeleteModal(true)}
          />
        </Section>

        {/* ABOUT */}
        <Section label="ABOUT">
          <Row
            icon={Info} iconBg="bg-app-elevated" iconColor="text-app-secondary"
            title="Version" value="1.0.0" isLabel
          />
          <Row
            icon={Lock} iconBg="bg-app-elevated" iconColor="text-app-secondary"
            title="Privacy policy"
            onPress={() => window.open('/privacy.html', '_blank', 'noopener')}
          />
        </Section>

        {/* Brand mark + tagline */}
        <div className="flex flex-col items-center gap-3 pb-4 pt-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden opacity-80">
            <BeaconMark size={40} tile={true} />
          </div>
          <p className="text-center text-[13px] text-app-tertiary italic px-6">
            "Showing up matters more than being perfect."
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="border-t border-app-elevated dark:border-white/10 bg-app-surface dark:bg-black flex items-center safe-area-inset-bottom px-2 py-3">
        <NavButton icon={Home}       active={false} onClick={() => onNavigate('today')} />
        <NavButton icon={TrendingUp} active={false} onClick={() => onNavigate('progress')} />
        <NavButton icon={PlusCircle}  active={false} onClick={onAddHabit} />
        <NavButton icon={ListChecks}  active={false} onClick={() => onNavigate('log')} />
        <NavButton icon={SettingsIcon} active={true}  onClick={() => onNavigate('settings')} />
      </nav>

      <ConfirmModal
        isOpen={!!restoreModal}
        title="Restore from backup?"
        description={
          restoreModal
            ? `Restore ${restoreModal.habitsCount} habit${restoreModal.habitsCount !== 1 ? 's' : ''} from backup${restoreModal.dateStr ? ` (saved ${restoreModal.dateStr})` : ''}? This will replace all your current data.`
            : ''
        }
        primaryLabel="Restore"
        primaryVariant="primary"
        secondaryLabel="Cancel"
        onPrimary={confirmRestore}
        onClose={() => setRestoreModal(null)}
      />

      <ConfirmModal
        isOpen={deleteModal}
        title="Delete everything?"
        description="This removes all your habits and logs permanently. There's no recovery."
        primaryLabel="Yes, delete all"
        primaryVariant="danger"
        secondaryLabel="Keep my data"
        onPrimary={() => { onDeleteAll() }}
        onClose={() => setDeleteModal(false)}
      />

      {/* Restore toast — success or error */}
      {toast && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 px-6 pointer-events-none">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-full border shadow-lg pointer-events-auto ${
            toast.type === 'success'
              ? 'bg-app-elevated border-white/10'
              : 'bg-red-950/90 border-red-500/30'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--app-accent-color)' }} />
              : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            }
            <p className={`text-[13px] font-medium ${toast.type === 'success' ? 'text-app-text' : 'text-red-300'}`}>
              {toast.message}
            </p>
            <button
              onClick={() => { clearTimeout(toastTimerRef.current); setToast(null) }}
              className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className={`w-3.5 h-3.5 ${toast.type === 'success' ? 'text-app-secondary' : 'text-red-400'}`} />
            </button>
          </div>
        </div>
      )}
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
