import { useState, useRef, useEffect } from 'react'
import {
  Trash2, Archive, Pencil, Check, X, ChevronLeft, ChevronUp, ChevronDown,
  Undo2,
  Droplet, Apple, Brain, BookOpen, Pill, Sun, Moon, Dumbbell,
  Bike, Coffee, Heart, Music, Wind, Mail, Target, Leaf, Sunrise
} from 'lucide-react'
import { brand } from '../../utils/brandVoice'
import { getTotalDaysLogged } from '../../utils/streakUtils'
import { today } from '../../utils/dateUtils'
import ConfirmModal from '../modules/ConfirmModal'

// ── Shared icon palette (same as TodayScreen) ─────────────────────────────────
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

const freqLabel = (habit) => {
  const f = habit.frequency || 'daily'
  const t = habit.frequencyTarget || 1
  if (f === 'daily')   return 'Daily'
  if (f === 'weekly')  return `${t}x weekly`
  if (f === 'monthly') return t === 1 ? 'Monthly' : `${t}x monthly`
  return 'Daily'
}

const TIME_OPTIONS  = [
  { key: 'morning',   label: 'Morning',   Icon: Sunrise },
  { key: 'afternoon', label: 'Afternoon', Icon: Sun     },
  { key: 'evening',   label: 'Evening',   Icon: Moon    },
  { key: 'anytime',   label: 'Anytime',   Icon: Leaf    },
]
const FREQ_OPTIONS  = ['daily', 'weekly', 'monthly']

export default function ManageHabitsScreen({ habits, logs, onUpdateHabits, onNavigate }) {
  const [tab, setTab]               = useState('active')
  const [editingId, setEditingId]   = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [archiveModal, setArchiveModal] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null) // { habit, secondsLeft, originalIndex }
  const deleteTimerRef = useRef(null)

  // Cleanup timer on unmount
  useEffect(() => () => { if (deleteTimerRef.current) clearInterval(deleteTimerRef.current) }, [])

  const activeHabits   = habits.filter(h => !h.archived)
  const archivedHabits = habits.filter(h => h.archived)
  const displayHabits  = tab === 'active' ? activeHabits : archivedHabits

  const todayISO = today()

  const startEdit = (habit) => {
    setEditingId(habit.id)
    setEditForm({
      name:            habit.name,
      time:            habit.time || 'morning',
      frequency:       habit.frequency || 'daily',
      frequencyTarget: habit.frequencyTarget || 1,
      createdAt:       habit.createdAt || todayISO,
      editingDate:     false,
    })
  }

  const saveEdit = () => {
    if (!editForm.name?.trim()) return
    const updated = habits.map(h => h.id === editingId ? {
      ...h,
      name:            editForm.name.trim(),
      time:            editForm.time,
      frequency:       editForm.frequency,
      frequencyTarget: Number(editForm.frequencyTarget) || 1,
      createdAt:       editForm.createdAt || todayISO,
    } : h)
    onUpdateHabits(updated)
    setEditingId(null)
  }

  const handleArchive = (habit) => {
    setArchiveModal({ habit, daysLogged: getTotalDaysLogged(habit.id, logs) })
  }
  const confirmArchive = () => {
    if (!archiveModal) return
    onUpdateHabits(habits.map(h =>
      h.id === archiveModal.habit.id
        ? { ...h, archived: true, archivedAt: today() }
        : h
    ))
    setArchiveModal(null)
  }

  const handleRestore = (habit) => {
    onUpdateHabits(habits.map(h =>
      h.id === habit.id ? { ...h, archived: false, archivedAt: null } : h
    ))
  }

  const [deleteModal, setDeleteModal] = useState(null)

  const handleDelete = (habit) => {
    setDeleteModal({ habit, daysLogged: getTotalDaysLogged(habit.id, logs) })
  }

  const confirmDelete = () => {
    if (!deleteModal) return
    const habit = deleteModal.habit

    // Clear any existing undo toast
    if (deleteTimerRef.current) {
      clearInterval(deleteTimerRef.current)
      deleteTimerRef.current = null
    }

    const originalIndex = habits.findIndex(h => h.id === habit.id)
    onUpdateHabits(habits.filter(h => h.id !== habit.id))
    setDeleteModal(null)

    // Start 5s undo window
    let secs = 5
    setPendingDelete({ habit, secondsLeft: secs, originalIndex })
    deleteTimerRef.current = setInterval(() => {
      secs -= 1
      if (secs <= 0) {
        clearInterval(deleteTimerRef.current)
        deleteTimerRef.current = null
        setPendingDelete(null)
      } else {
        setPendingDelete(prev => prev ? { ...prev, secondsLeft: secs } : null)
      }
    }, 1000)
  }

  const handleUndoDelete = () => {
    if (!pendingDelete) return
    clearInterval(deleteTimerRef.current)
    deleteTimerRef.current = null
    const restored = [...habits]
    restored.splice(pendingDelete.originalIndex, 0, pendingDelete.habit)
    onUpdateHabits(restored)
    setPendingDelete(null)
  }

  // Move a habit up or down within its time-of-day group
  const moveHabit = (habitId, direction) => {
    const habit = habits.find(h => h.id === habitId)
    const groupKey = habit.time || 'anytime'
    const groupHabits = habits.filter(h => !h.archived && (h.time || 'anytime') === groupKey)
    const groupIdx = groupHabits.findIndex(h => h.id === habitId)
    const swapIdx  = direction === 'up' ? groupIdx - 1 : groupIdx + 1
    if (swapIdx < 0 || swapIdx >= groupHabits.length) return
    const swapHabit = groupHabits[swapIdx]
    const next = [...habits]
    const idxA = next.findIndex(h => h.id === habitId)
    const idxB = next.findIndex(h => h.id === swapHabit.id)
    ;[next[idxA], next[idxB]] = [next[idxB], next[idxA]]
    onUpdateHabits(next)
  }

  // Group active habits by time-of-day
  const groups = [
    { key: 'morning',   label: 'MORNING',   Icon: Sunrise },
    { key: 'afternoon', label: 'AFTERNOON',  Icon: Sun },
    { key: 'evening',   label: 'EVENING',    Icon: Moon },
    { key: 'anytime',   label: 'ANYTIME',    Icon: Leaf },
  ]

  const renderHabitRow = (habit, { isFirst = false, isLast = false } = {}) => {
    const { Icon: HabitIcon, bg, color } = getHabitIcon(habit.name)
    const isEditing = editingId === habit.id

    return (
      <div key={habit.id} className="bg-app-surface rounded-2xl border border-app-elevated overflow-hidden mb-2">
        {/* ── Main row ── */}
        <div className="flex items-center gap-2 px-3 py-3">
          {/* Up / Down reorder arrows — hidden while editing to reduce clutter */}
          {tab === 'active' && !isEditing && (
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={() => moveHabit(habit.id, 'up')}
                disabled={isFirst}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  isFirst ? 'text-app-elevated cursor-default' : 'text-app-tertiary active:text-app-text'
                }`}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveHabit(habit.id, 'down')}
                disabled={isLast}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  isLast ? 'text-app-elevated cursor-default' : 'text-app-tertiary active:text-app-text'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
            <HabitIcon className={`w-5 h-5 ${color}`} />
          </div>

          {/* Name + frequency */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-app-text leading-snug truncate">
              {habit.name}
            </p>
            <p className="text-[12px] text-app-secondary mt-0.5">
              {freqLabel(habit)} · {habit.time || 'anytime'}
            </p>
          </div>

          {/* Actions */}
          {tab === 'active' && (
            <div className="flex gap-1.5 flex-shrink-0">
              {/* Only show pencil when not editing — expanded card has its own Save/Cancel */}
              {!isEditing && (
                <button
                  onClick={() => startEdit(habit)}
                  className="w-8 h-8 rounded-lg bg-app-elevated flex items-center justify-center transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-app-secondary" />
                </button>
              )}
              {!isEditing && (
                <>
                  <button onClick={() => handleArchive(habit)}
                    className="w-8 h-8 rounded-lg bg-app-elevated flex items-center justify-center transition-colors">
                    <Archive className="w-3.5 h-3.5 text-app-secondary" />
                  </button>
                  <button onClick={() => handleDelete(habit)}
                    className="w-8 h-8 rounded-lg bg-app-elevated flex items-center justify-center transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </>
              )}
            </div>
          )}

          {tab === 'archived' && (
            <button onClick={() => handleRestore(habit)}
              className="px-3 py-1.5 rounded-lg bg-app-elevated text-[12px] font-semibold text-app-text transition-colors flex-shrink-0">
              Restore
            </button>
          )}
        </div>

        {/* ── Edit sheet (expands below) ── */}
        {isEditing && (
          <div className="border-t border-app-elevated" style={{ backgroundColor: 'var(--app-bg)' }}>

            {/* Name */}
            <div className="px-4 pt-4 pb-3 border-b border-app-elevated flex items-center gap-2">
              <input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                maxLength={20}
                className="flex-1 bg-transparent text-app-text text-[15px] font-semibold focus:outline-none placeholder-app-tertiary"
                placeholder="Habit name"
              />
              <Pencil className="w-3 h-3 text-app-tertiary flex-shrink-0" />
            </div>

            {/* When + Repeat — side by side, 1px gap acting as divider */}
            <div
              className="grid grid-cols-2 border-b border-app-elevated"
              style={{ gap: '1px', backgroundColor: 'var(--app-elevated)' }}
            >
              {/* When — 2×2 grid */}
              <div className="px-3 py-3 flex flex-col" style={{ backgroundColor: 'var(--app-bg)' }}>
                <p className="text-[9px] font-bold text-app-tertiary uppercase tracking-widest mb-2">When</p>
                <div className="grid grid-cols-2 gap-1 flex-1">
                  {TIME_OPTIONS.map(({ key, label, Icon }) => {
                    const sel = editForm.time === key
                    return (
                      <button key={key} onClick={() => setEditForm(f => ({ ...f, time: key }))}
                        className={`h-full rounded-lg text-[11px] font-semibold transition-all active:opacity-80 flex flex-col items-center justify-center gap-1 border ${
                          sel
                            ? 'bg-app-green-surface border-app-green text-app-text'
                            : 'bg-app-elevated border-transparent text-app-secondary'
                        }`}>
                        <Icon className={`w-3.5 h-3.5 ${sel ? 'text-app-green' : ''}`} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Repeat */}
              <div className="px-3 py-3" style={{ backgroundColor: 'var(--app-bg)' }}>
                <p className="text-[9px] font-bold text-app-tertiary uppercase tracking-widest mb-2">Repeat</p>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setEditForm(p => ({ ...p, frequency: 'daily', frequencyTarget: 1 }))}
                    className={`w-full py-1.5 rounded-lg text-[11px] font-semibold transition-all active:opacity-80 border ${
                      editForm.frequency === 'daily'
                        ? 'bg-app-green-surface border-app-green text-app-text'
                        : 'bg-app-elevated border-transparent text-app-secondary'
                    }`}>
                    Daily
                  </button>

                  {['weekly', 'monthly'].map(freq => {
                    const isSelected = editForm.frequency === freq
                    const max = freq === 'weekly' ? 6 : 30
                    const cur = isSelected ? (editForm.frequencyTarget || 1) : 1
                    const centerLabel = isSelected
                      ? `${cur}× ${freq}`
                      : freq.charAt(0).toUpperCase() + freq.slice(1)
                    return (
                      <div key={freq} className={`flex items-center rounded-lg overflow-hidden border transition-all ${
                        isSelected ? 'border-app-green' : 'border-transparent'
                      }`}>
                        <button
                          onClick={() => setEditForm(p => {
                            const t = p.frequency === freq ? (p.frequencyTarget || 1) : 1
                            return { ...p, frequency: freq, frequencyTarget: Math.max(1, t - 1) }
                          })}
                          className={`px-2 py-1.5 text-[13px] font-bold transition-all active:opacity-80 ${
                            isSelected ? 'bg-app-green-surface text-app-green' : 'bg-app-elevated text-app-secondary'
                          }`}
                        >−</button>
                        <button
                          onClick={() => setEditForm(p => ({ ...p, frequency: freq }))}
                          className={`flex-1 py-1.5 text-[11px] font-semibold transition-all ${
                            isSelected ? 'bg-app-green-surface text-white' : 'bg-app-elevated text-app-secondary'
                          }`}
                        >{centerLabel}</button>
                        <button
                          onClick={() => setEditForm(p => {
                            const t = p.frequency === freq ? (p.frequencyTarget || 1) : 1
                            return { ...p, frequency: freq, frequencyTarget: Math.min(max, t + 1) }
                          })}
                          className={`px-2 py-1.5 text-[13px] font-bold transition-all active:opacity-80 ${
                            isSelected ? 'bg-app-green-surface text-app-green' : 'bg-app-elevated text-app-secondary'
                          }`}
                        >+</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Since */}
            <div className="px-4 py-3 border-b border-app-elevated">
              {!editForm.editingDate ? (
                <button
                  type="button"
                  onClick={() => setEditForm(f => ({ ...f, editingDate: true }))}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <span className="text-[9px] font-bold text-app-tertiary uppercase tracking-widest">Start date</span>
                  <span className="text-[13px] text-app-secondary">
                    {new Date((editForm.createdAt || todayISO) + 'T00:00:00')
                      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <Pencil className="w-3 h-3 text-app-tertiary ml-auto" />
                </button>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={editForm.createdAt}
                    onChange={e => setEditForm(f => ({ ...f, createdAt: e.target.value }))}
                    onBlur={() => {
                      const parsed = new Date((editForm.createdAt || '') + 'T00:00:00')
                      if (isNaN(parsed.getTime()) || editForm.createdAt > todayISO) {
                        setEditForm(f => ({ ...f, createdAt: todayISO }))
                      }
                      setEditForm(f => ({ ...f, editingDate: false }))
                    }}
                    autoFocus
                    placeholder="YYYY-MM-DD"
                    className="w-full bg-transparent text-app-text text-[13px] focus:outline-none placeholder-app-tertiary pb-1"
                    style={{ borderBottom: '1px solid var(--app-accent-color)' }}
                  />
                  <p className="text-[10px] text-app-tertiary">YYYY-MM-DD · tap away to confirm</p>
                </div>
              )}
            </div>

            {/* Save / Cancel */}
            <div className="px-4 py-3 flex gap-2">
              <button
                onClick={saveEdit}
                style={{ backgroundColor: 'var(--app-accent-color)' }}
                className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-bold tracking-wide active:scale-[0.98] transition-all"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="w-10 h-10 rounded-xl bg-app-elevated text-app-secondary flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-app-bg">

      {/* Header with back arrow */}
      <div className="sticky top-0 z-10 bg-app-bg px-4 safe-top pb-4 border-b border-app-elevated flex items-center gap-3">
        <button onClick={() => onNavigate('settings')}
          className="w-8 h-8 rounded-xl bg-app-elevated flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-70">
          <ChevronLeft className="w-5 h-5 text-app-text" />
        </button>
        <h1 className="text-[22px] font-bold text-app-text">Manage habits</h1>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex bg-app-elevated rounded-2xl p-1 gap-1">
          {['active', 'archived'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold capitalize transition-colors ${
                tab === t
                  ? 'bg-app-surface text-app-text shadow-sm'
                  : 'text-app-secondary hover:text-app-text'
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {tab === 'active' ? (
          /* Group by time of day */
          groups.map(({ key, label, Icon: TimeIcon }) => {
            const sectionHabits = displayHabits.filter(h => (h.time || 'anytime') === key)
            if (sectionHabits.length === 0) return null
            return (
              <div key={key} className="mb-4">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <TimeIcon className="w-3 h-3 text-app-tertiary" />
                  <span className="text-[10px] font-semibold text-app-tertiary uppercase tracking-widest">{label}</span>
                </div>
                {sectionHabits.map((habit, idx) =>
                  renderHabitRow(habit, {
                    isFirst: idx === 0,
                    isLast:  idx === sectionHabits.length - 1,
                  })
                )}
              </div>
            )
          })
        ) : (
          /* Archived — flat list, no reorder arrows */
          displayHabits.length === 0
            ? <p className="text-app-secondary text-sm text-center py-8">Nothing archived yet.</p>
            : displayHabits.map(habit => renderHabitRow(habit))
        )}
      </div>

      {/* Undo delete toast — fixed bottom center */}
      {pendingDelete && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-6 pointer-events-none">
          <div className="flex items-center gap-3 pl-3 pr-2 py-2 bg-app-elevated rounded-full border border-white/10 shadow-lg pointer-events-auto">
            {/* Countdown badge */}
            <span className="w-6 h-6 rounded-full bg-app-surface flex items-center justify-center text-[11px] font-bold text-app-secondary flex-shrink-0">
              {pendingDelete.secondsLeft}
            </span>
            <p className="text-[13px] text-app-text whitespace-nowrap">
              "{pendingDelete.habit.name}" deleted
            </p>
            {/* Highlighted Undo button — solid accent background */}
            <button
              onClick={handleUndoDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold text-white active:opacity-70 transition-opacity flex-shrink-0"
              style={{ backgroundColor: 'var(--app-accent-color)' }}
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={Boolean(archiveModal)}
        title={archiveModal ? `Archive "${archiveModal.habit.name}"?` : ''}
        description={archiveModal ? `You've logged it ${archiveModal.daysLogged} ${archiveModal.daysLogged === 1 ? 'day' : 'days'}. History is preserved.` : ''}
        primaryLabel="Archive it"
        primaryVariant="default"
        secondaryLabel="Keep active"
        onPrimary={confirmArchive}
        onClose={() => setArchiveModal(null)}
      />
      <ConfirmModal
        isOpen={Boolean(deleteModal)}
        title={deleteModal ? `Delete "${deleteModal.habit.name}"?` : ''}
        description={deleteModal
          ? deleteModal.daysLogged === 0
            ? 'You have no days logged.'
            : `${deleteModal.daysLogged} ${deleteModal.daysLogged === 1 ? 'day' : 'days'} of history will be lost.`
          : ''}
        primaryLabel="Yes, delete"
        primaryVariant="danger"
        secondaryLabel="Keep it"
        onPrimary={confirmDelete}
        onClose={() => setDeleteModal(null)}
      />
    </div>
  )
}
