import { useState, useRef, useEffect } from 'react'
import { setHabits, setLogs, setUserProfile, deleteAllData, getLastSeenDate, setLastSeenDate } from '../utils/storageUtils'
import { Undo2, CheckCircle } from 'lucide-react'
import { today as localToday } from '../utils/dateUtils'
import { getWelcomeBackCopy } from '../utils/streakUtils'
import TodayScreen from './screens/TodayScreen'
import AddHabitScreen from './screens/AddHabitScreen'
import LogScreen from './screens/LogScreen'
import ProgressScreen from './screens/ProgressScreen'
import SettingsScreen from './screens/SettingsScreen'
import ManageHabitsScreen from './screens/ManageHabitsScreen'

export default function MainApp({ state, setState, updateTheme, theme, colorScheme, updateColorScheme, onImportData }) {
  const [currentScreen, setCurrentScreen] = useState('today')
  const [addHabitOpen, setAddHabitOpen] = useState(false)
  const [confirmationHabit, setConfirmationHabit] = useState(null)
  const [pendingDeleteAll, setPendingDeleteAll] = useState(null) // { snapshot, secondsLeft }
  const deleteAllTimerRef = useRef(null)
  const [restoreToast, setRestoreToast] = useState(null) // { message }
  const restoreToastTimerRef = useRef(null)

  // ── App-level welcome-back (B6) ───────────────────────────────────────────
  // Computed ONCE on mount from lastSeenDate — never re-derived on date rollover.
  // null when absent < 2 completed days (no message warranted).
  const [appWelcomeBack] = useState(() => {
    const todayStr = localToday()
    const lastSeen = getLastSeenDate()
    setLastSeenDate(todayStr) // update immediately so next open uses today as baseline
    if (!lastSeen || lastSeen >= todayStr) return null
    const daysSince = Math.round(
      (new Date(todayStr + 'T12:00:00') - new Date(lastSeen + 'T12:00:00')) / 86400000
    )
    // missedCompletedDays = daysSince - 1 (today is still in progress, not "missed")
    return getWelcomeBackCopy(daysSince - 1)
  })

  useEffect(() => () => {
    if (deleteAllTimerRef.current) clearInterval(deleteAllTimerRef.current)
    clearTimeout(restoreToastTimerRef.current)
  }, [])

  const handleToggleHabit = (newLogs) => {
    setLogs(newLogs)
    setState((prev) => ({ ...prev, logs: newLogs }))
  }

  const handleUpdateHabits = (newHabits) => {
    setHabits(newHabits)
    setState((prev) => ({ ...prev, habits: newHabits }))
  }

  const handleAddHabit = (addAnother) => {
    if (!addAnother) {
      setAddHabitOpen(false)
      setConfirmationHabit(null)
      setCurrentScreen('today')
    } else {
      setConfirmationHabit(null)
      // Keep form open, user can add another
    }
  }

  const handleCreateHabit = (habitName, habitTime, startDate) => {
    const habitId = `habit-${Date.now()}`
    const today   = localToday()
    const newHabits = [
      ...state.habits,
      {
        id: habitId,
        name: habitName,
        time: habitTime,
        frequency: 'daily',
        frequencyTarget: 1,
        createdAt: startDate || today,
        icon: null,
        color: null,
        archived: false,
        archivedAt: null,
        restartedAt: null
      }
    ]

    handleUpdateHabits(newHabits)
    setConfirmationHabit({ habitName, habitTime })
  }

  const handleUpdateProfile = (profile) => {
    setState((prev) => ({ ...prev, userProfile: profile }))
  }

  const handleDeleteAll = () => {
    // Snapshot before wiping
    const snapshot = {
      habits: state.habits,
      logs: state.logs,
      userProfile: state.userProfile,
    }

    // Clear localStorage + reset React state, navigate to today (name is preserved)
    deleteAllData()
    setState((prev) => ({ ...prev, habits: [], logs: {}, userProfile: { name: prev.userProfile?.name || '' } }))
    setCurrentScreen('today')

    // Clear any existing timer
    if (deleteAllTimerRef.current) clearInterval(deleteAllTimerRef.current)

    // Start 5s undo window
    let secs = 5
    setPendingDeleteAll({ snapshot, secondsLeft: secs })
    deleteAllTimerRef.current = setInterval(() => {
      secs -= 1
      if (secs <= 0) {
        clearInterval(deleteAllTimerRef.current)
        deleteAllTimerRef.current = null
        setPendingDeleteAll(null)
      } else {
        setPendingDeleteAll(prev => prev ? { ...prev, secondsLeft: secs } : null)
      }
    }, 1000)
  }

  const handleUndoDeleteAll = () => {
    if (!pendingDeleteAll) return
    clearInterval(deleteAllTimerRef.current)
    deleteAllTimerRef.current = null
    const { habits, logs, userProfile } = pendingDeleteAll.snapshot
    // Restore localStorage + React state
    setHabits(habits)
    setLogs(logs)
    setUserProfile(userProfile)
    setState(prev => ({ ...prev, habits, logs, userProfile }))
    setPendingDeleteAll(null)
  }

  const openAddHabit = () => setAddHabitOpen(true)

  const handleImportData = (imported) => {
    onImportData(imported)
    setCurrentScreen('today')
    // Show success toast at MainApp level — it persists after navigation
    clearTimeout(restoreToastTimerRef.current)
    setRestoreToast({ message: 'Backup restored successfully.' })
    restoreToastTimerRef.current = setTimeout(() => setRestoreToast(null), 4000)
  }

  const screenProps = {
    userProfile: state.userProfile,
    habits: state.habits,
    logs: state.logs,
    onToggleHabit: handleToggleHabit,
    onUpdateHabits: handleUpdateHabits,
    onNavigate: setCurrentScreen,
    onAddHabit: openAddHabit,
    onImportData: handleImportData,
    appWelcomeBack,  // app-level, computed once on mount
  }

  return (
    <div className="bg-black">
      {currentScreen === 'today' && (
        <TodayScreen {...screenProps} />
      )}

      {currentScreen === 'log' && (
        <LogScreen {...screenProps} />
      )}

      {currentScreen === 'progress' && (
        <ProgressScreen {...screenProps} />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          {...screenProps}
          onUpdateProfile={handleUpdateProfile}
          theme={theme}
          onThemeChange={updateTheme}
          onDeleteAll={handleDeleteAll}
          colorScheme={colorScheme}
          onColorSchemeChange={updateColorScheme}
        />
      )}

      {currentScreen === 'manage' && (
        <ManageHabitsScreen
          {...screenProps}
        />
      )}

      {/* Add Habit — global overlay, openable from any screen */}
      {addHabitOpen && (
        <AddHabitScreen
          isOpen={true}
          onClose={() => { setAddHabitOpen(false); setConfirmationHabit(null) }}
          onAdd={handleAddHabit}
          confirmation={confirmationHabit}
          onCreateHabit={handleCreateHabit}
        />
      )}

      {/* Restore success toast — persists after navigation to today */}
      {restoreToast && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 px-6 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-app-elevated border border-white/10 shadow-lg pointer-events-auto">
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--app-accent-color)' }} />
            <p className="text-[13px] font-medium text-app-text">{restoreToast.message}</p>
          </div>
        </div>
      )}

      {/* Undo delete-all toast — persists across screen changes */}
      {pendingDeleteAll && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-6 pointer-events-none">
          <div className="flex items-center gap-3 pl-3 pr-2 py-2 bg-app-elevated rounded-full border border-white/10 shadow-lg pointer-events-auto">
            <span className="w-6 h-6 rounded-full bg-app-surface flex items-center justify-center text-[11px] font-bold text-app-secondary flex-shrink-0">
              {pendingDeleteAll.secondsLeft}
            </span>
            <p className="text-[13px] text-app-text whitespace-nowrap">All data deleted</p>
            <button
              onClick={handleUndoDeleteAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold text-white active:opacity-70 transition-opacity flex-shrink-0"
              style={{ backgroundColor: 'var(--app-accent-color)' }}
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
