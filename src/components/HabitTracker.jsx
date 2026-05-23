import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Check, TrendingUp, Calendar, ChevronDown, ChevronLeft, ChevronRight, Rocket, Undo2, Download, Upload, MoreHorizontal } from 'lucide-react';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedHabits, setExpandedHabits] = useState(new Set());
  const [feedback, setFeedback] = useState('');
  const [renamingHabit, setRenamingHabit] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const [undoCountdown, setUndoCountdown] = useState(4);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [newHabitType, setNewHabitType] = useState('daily');
  const [newHabitWeeklyTarget, setNewHabitWeeklyTarget] = useState(3);
  const [newHabitMonthlyTarget, setNewHabitMonthlyTarget] = useState(1);
  const viewMode = '1col';
  const habitsRef = React.useRef(habits);
  React.useEffect(() => { habitsRef.current = habits; }, [habits]);
  const [tourStep, setTourStep] = useState(null);
  const [feedbackFading, setFeedbackFading] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(() => localStorage.getItem('heatmap-mode') || 'month');
  const [monthOffset, setMonthOffset] = useState(0);
  const [nameError, setNameError] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const fileInputRef = React.useRef(null);

  const TOUR_STEPS = [
    { icon: '➕', title: 'Add a Habit', description: 'Tap "Add Habit" to create a new habit you want to track daily.' },
    { icon: '✅', title: 'Log Your Day', description: 'Tap "Log" each day you complete a habit. Tap "Done" again to unlog if you made a mistake.' },
    { icon: '📈', title: 'Track Progress', description: 'The tracker pill shows logged vs total days. Tap it to expand your 30-day heatmap and toggle individual days.' },
    { icon: '🔥', title: 'Streak & Gap Badges', description: 'Green badge = active streak. Amber/red badge = days missed. Keep the fire alive!' },
    { icon: '✏️', title: 'Manage Habits', description: 'Tap the pencil icon to enter manage mode — rename habits by tapping their name, reorder with arrows, or delete.' },
  ];

  useEffect(() => { loadHabits(); }, []);
  useEffect(() => {
    if (!localStorage.getItem('habit-tour-seen')) setTourStep(0);
  }, []);
  useEffect(() => {
    if (!undoToast?.showTimer) { setUndoCountdown(undoToast?.duration || 4); return; }
    setUndoCountdown(undoToast.duration);
    const interval = setInterval(() => {
      setUndoCountdown(c => (c <= 1 ? (clearInterval(interval), 0) : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [undoToast]);

  const endTour = () => {
    localStorage.setItem('habit-tour-seen', '1');
    setTourStep(null);
  };

  const showFeedback = (message) => {
    setFeedback(message);
    setFeedbackFading(false);
    setTimeout(() => setFeedbackFading(true), 700);
    setTimeout(() => { setFeedback(''); setFeedbackFading(false); }, 1000);
  };

  const loadHabits = async () => {
    try {
      if (window.storage) {
        const result = await window.storage.get('habits-data');
        if (result && result.value) {
          setHabits(JSON.parse(result.value));
          setLoading(false);
          return;
        }
      }
    } catch (e) {}
    try {
      const stored = localStorage.getItem('habits-data');
      if (stored) setHabits(JSON.parse(stored));
    } catch (e) {}
    setLoading(false);
  };

  const saveHabits = async (updatedHabits) => {
    habitsRef.current = updatedHabits;
    setHabits(updatedHabits);
    let success = false;
    try {
      if (window.storage) {
        await window.storage.set('habits-data', JSON.stringify(updatedHabits));
        success = true;
      }
    } catch (e) {}
    try {
      localStorage.setItem('habits-data', JSON.stringify(updatedHabits));
      success = true;
    } catch (e) {}
    if (!success) { showFeedback('❌ Failed to save'); return false; }
    return true;
  };

  const exportBackup = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits,
      preferences: { heatmapMode },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `habit-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('✅ Backup downloaded!');
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.habits || !Array.isArray(parsed.habits)) throw new Error('Invalid backup file');
        setConfirmDialog({
          message: `Restore ${parsed.habits.length} habit${parsed.habits.length !== 1 ? 's' : ''} from backup? This will replace all your current data.`,
          confirmLabel: 'Restore',
          confirmColor: 'bg-indigo-600 hover:bg-indigo-700',
          onConfirm: async () => {
            await saveHabits(parsed.habits);
            if (parsed.preferences?.heatmapMode) {
              setHeatmapMode(parsed.preferences.heatmapMode);
              localStorage.setItem('heatmap-mode', parsed.preferences.heatmapMode);
            }
            showFeedback(`✅ ${parsed.habits.length} habits restored!`);
          },
        });
      } catch {
        showFeedback('❌ Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const addHabit = async (e) => {
    if (e) e.preventDefault();
    const habitName = newHabit.trim();
    if (!habitName) { setNameError(true); return; }
    setNameError(false);
    showFeedback('⏳ Adding...');
    const habit = {
      id: Date.now().toString(), name: habitName, dates: [],
      type: newHabitType,
      ...(newHabitType === 'weekly' ? { weeklyTarget: newHabitWeeklyTarget } : {}),
      ...(newHabitType === 'monthly' ? { monthlyTarget: newHabitMonthlyTarget } : {})
    };
    const saved = await saveHabits([...habits, habit]);
    if (saved) {
      showFeedback('✅ Habit added!');
      setNewHabit(''); setIsAddingHabit(false);
      setNewHabitType('daily'); setNewHabitWeeklyTarget(3); setNewHabitMonthlyTarget(1);
    }
  };

  const logToday = async (habitId) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const updated = habitsRef.current.map(h =>
      h.id === habitId && !h.dates.includes(today)
        ? { ...h, dates: [...h.dates, today].sort().reverse() }
        : h
    );
    const saved = await saveHabits(updated);
    if (saved) confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const resetHabit = (habitId) => {
    setConfirmDialog({
      message: 'Reset this habit? All logged dates will be lost and it will start fresh.',
      confirmLabel: 'Reset',
      confirmColor: 'bg-red-500 hover:bg-red-600',
      onConfirm: async () => {
        const prev = habits.find(h => h.id === habitId);
        const saved = await saveHabits(habits.map(h => h.id === habitId ? { ...h, dates: [], startDate: Date.now().toString() } : h));
        setConfirmDialog(null);
        if (saved) {
          if (undoToast?.timeoutId) clearTimeout(undoToast.timeoutId);
          const timeoutId = setTimeout(() => setUndoToast(null), 5000);
          setUndoToast({ type: 'reset', habitId, prevDates: prev.dates, prevStartDate: prev.startDate, message: 'Habit reset', showTimer: true, duration: 5, timeoutId });
        }
      }
    });
  };

  const deleteHabit = (habitId) => {
    setConfirmDialog({
      message: 'Delete this habit? All logged dates will be lost.',
      onConfirm: async () => {
        const prev = habits.find(h => h.id === habitId);
        const saved = await saveHabits(habits.filter(h => h.id !== habitId));
        setConfirmDialog(null);
        if (saved) {
          if (undoToast?.timeoutId) clearTimeout(undoToast.timeoutId);
          const timeoutId = setTimeout(() => setUndoToast(null), 5000);
          setUndoToast({ type: 'delete', habit: prev, message: 'Habit deleted', showTimer: true, duration: 5, timeoutId });
        }
      }
    });
  };

  const updateHabitType = async (habitId, type, target) => {
    const updated = habits.map(h => h.id === habitId ? {
      ...h, type,
      ...(type === 'weekly' ? { weeklyTarget: target ?? 3 } : {}),
      ...(type === 'monthly' ? { monthlyTarget: target ?? 1 } : {})
    } : h);
    await saveHabits(updated);
  };

  const startRenaming = (habit) => { setRenamingHabit(habit.id); setEditName(habit.name); };

  const saveRename = async (habitId) => {
    const trimmedName = editName.trim();
    if (!trimmedName) { showFeedback('⚠️ Name cannot be empty'); setRenamingHabit(null); return; }
    const original = habits.find(h => h.id === habitId)?.name;
    setRenamingHabit(null);
    setEditName('');
    if (trimmedName === original) return;
    const updated = habits.map(h => h.id === habitId ? { ...h, name: trimmedName } : h);
    await saveHabits(updated);
    showFeedback('✅ Renamed!');
  };

  const toggleDate = async (habitId, dateStr, isLogged) => {
    if (isLogged) {
      const updated = habitsRef.current.map(h =>
        h.id === habitId ? { ...h, dates: h.dates.filter(d => d !== dateStr) } : h
      );
      await saveHabits(updated);
    } else {
      const updated = habitsRef.current.map(h =>
        h.id === habitId ? { ...h, dates: [...h.dates, dateStr].sort().reverse() } : h
      );
      await saveHabits(updated);
    }
  };

  const handleUndo = async () => {
    if (!undoToast) return;
    clearTimeout(undoToast.timeoutId);
    if (undoToast.type === 'delete') {
      await saveHabits([...habits, undoToast.habit].sort((a, b) => a.id.localeCompare(b.id)));
    } else if (undoToast.type === 'reset') {
      await saveHabits(habits.map(h =>
        h.id === undoToast.habitId ? { ...h, dates: undoToast.prevDates, startDate: undoToast.prevStartDate } : h
      ));
    }
    setUndoToast(null);
  };

  const moveHabitUp = async (index) => {
    if (index === 0) return;
    const r = [...habits];
    const [removed] = r.splice(index, 1);
    r.splice(index - 1, 0, removed);
    await saveHabits(r);
    showFeedback('✅ Moved up');
  };

  const moveHabitDown = async (index) => {
    if (index === habits.length - 1) return;
    const r = [...habits];
    const [removed] = r.splice(index, 1);
    r.splice(index + 1, 0, removed);
    await saveHabits(r);
    showFeedback('✅ Moved down');
  };

  const toggleHabitExpansion = (habitId) => {
    setExpandedHabits(prev => {
      const next = new Set(prev);
      next.has(habitId) ? next.delete(habitId) : next.add(habitId);
      return next;
    });
  };

  // ── Weekly helpers ──────────────────────────────────────────────
  const getWeekStart = (date) => {
    const d = new Date(date); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d;
  };
  const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const isWeekGoalMet = (dates, target, weekStart) => {
    const ws = toDateStr(weekStart);
    const we = toDateStr(new Date(weekStart.getTime() + 6 * 86400000));
    return dates.filter(d => d >= ws && d <= we).length >= target;
  };

  const getWeeklyStreakInfo = (dates, target) => {
    if (!dates.length) return { current: 0, longest: 0 };
    const today = new Date(); today.setHours(0,0,0,0);
    const curWeek = getWeekStart(today);
    let current = 0, w = new Date(curWeek);
    if (isWeekGoalMet(dates, target, w)) {
      current++; w.setDate(w.getDate() - 7);
      while (isWeekGoalMet(dates, target, w)) { current++; w.setDate(w.getDate() - 7); }
    } else {
      w.setDate(w.getDate() - 7);
      while (isWeekGoalMet(dates, target, w)) { current++; w.setDate(w.getDate() - 7); }
    }
    const earliest = getWeekStart(new Date([...dates].sort()[0] + 'T00:00:00'));
    let longest = 0, temp = 0, ww = new Date(earliest);
    while (ww <= curWeek) {
      if (isWeekGoalMet(dates, target, ww)) { temp++; longest = Math.max(longest, temp); }
      else temp = 0;
      ww.setDate(ww.getDate() + 7);
    }
    return { current, longest };
  };

  const getWeeklyGap = (dates, target) => {
    if (!dates.length) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const curWeek = getWeekStart(today);
    const curWeekEnd = new Date(curWeek.getTime() + 6 * 86400000);
    if (dates.some(d => d >= toDateStr(curWeek) && d <= toDateStr(curWeekEnd))) return null;
    let w = new Date(curWeek); w.setDate(w.getDate() - 7); let gap = 0;
    for (let i = 0; i < 52; i++) {
      if (isWeekGoalMet(dates, target, w)) return gap > 0 ? gap : null;
      gap++; w.setDate(w.getDate() - 7);
    }
    return null;
  };

  const prevMonthStr = (monthStr) => {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };
  const nextMonthStr = (monthStr) => {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };
  const isMonthGoalMet = (dates, target, monthStr) =>
    dates.filter(d => d.startsWith(monthStr)).length >= target;

  const getMonthlyStreakInfo = (dates, target) => {
    if (!dates.length) return { current: 0, longest: 0 };
    const today = new Date();
    const curMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
    let current = 0, m = curMonth;
    if (isMonthGoalMet(dates, target, m)) {
      current++; m = prevMonthStr(m);
      while (isMonthGoalMet(dates, target, m)) { current++; m = prevMonthStr(m); }
    } else {
      m = prevMonthStr(m);
      while (isMonthGoalMet(dates, target, m)) { current++; m = prevMonthStr(m); }
    }
    const earliest = [...dates].sort()[0].slice(0, 7);
    let longest = 0, temp = 0, mm = earliest;
    while (mm <= curMonth) {
      if (isMonthGoalMet(dates, target, mm)) { temp++; longest = Math.max(longest, temp); }
      else temp = 0;
      mm = nextMonthStr(mm);
    }
    return { current, longest };
  };

  const getMonthlyGap = (dates, target) => {
    if (!dates.length) return null;
    const today = new Date();
    const curMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
    if (dates.some(d => d.startsWith(curMonth))) return null;
    let m = prevMonthStr(curMonth), gap = 0;
    for (let i = 0; i < 24; i++) {
      if (isMonthGoalMet(dates, target, m)) return gap > 0 ? gap : null;
      gap++; m = prevMonthStr(m);
    }
    return null;
  };

  const getCurrentWeekDays = () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const ws = getWeekStart(today);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return toDateStr(d); });
  };
  // ────────────────────────────────────────────────────────────────

  const getStreakInfo = (dates) => {
    if (!dates.length) return { current: 0, longest: 0 };
    const sorted = [...dates].sort().reverse();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    const dayDiff = (a, b) => {
      const [ay, am, ad] = a.split('-').map(Number);
      const [by, bm, bd] = b.split('-').map(Number);
      return (Date.UTC(ay, am-1, ad) - Date.UTC(by, bm-1, bd)) / 86400000;
    };
    let current = 0;
    if (sorted[0] === today || sorted[0] === yesterdayStr) {
      current = 1;
      for (let i = 1; i < sorted.length; i++) {
        if (dayDiff(sorted[i-1], sorted[i]) === 1) current++; else break;
      }
    }
    let longest = 0, temp = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (dayDiff(sorted[i-1], sorted[i]) === 1) temp++; else { longest = Math.max(longest, temp); temp = 1; }
    }
    longest = Math.max(longest, temp);
    return { current, longest };
  };

  const dateToUTC = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return Date.UTC(y, m-1, d);
  };
  const todayUTC = () => {
    const n = new Date();
    return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  };

  const getDaysSinceLastLog = (dates) => {
    if (!dates.length) return null;
    const missed = (todayUTC() - dateToUTC(dates[0])) / 86400000 - 1;
    return missed > 0 ? missed : null;
  };

  const getTotalDays = (habitId, dates, startDate) => {
    const creation = new Date(parseInt(startDate || habitId));
    const creationUTC = Date.UTC(creation.getFullYear(), creation.getMonth(), creation.getDate());
    const earliestUTC = dates.length ? dateToUTC([...dates].sort()[0]) : creationUTC;
    const startUTC = Math.min(earliestUTC, creationUTC);
    return (todayUTC() - startUTC) / 86400000 + 1;
  };

  const isLoggedToday = (dates) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    return dates.includes(today);
  };

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(y, m-1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">

      {/* Feedback toast */}
      {feedback && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-xl shadow-lg z-50 font-semibold text-gray-800 transition-opacity duration-300 ${feedbackFading ? 'opacity-0' : 'opacity-100'}`}>
          {feedback}
        </div>
      )}

      {/* Tour overlay */}
      {tourStep !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 shadow-2xl">
            <div className="text-4xl mb-3 text-center">{TOUR_STEPS[tourStep].icon}</div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">{TOUR_STEPS[tourStep].title}</h2>
            <p className="text-gray-500 text-center text-sm mb-6">{TOUR_STEPS[tourStep].description}</p>
            <div className="flex justify-center gap-1.5 mb-6">
              {TOUR_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === tourStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-gray-300'}`} />
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={endTour} className="flex-1 py-3 rounded-xl text-gray-500 font-medium border border-gray-200 hover:bg-gray-50">
                Skip
              </button>
              <button
                onClick={() => tourStep < TOUR_STEPS.length - 1 ? setTourStep(tourStep + 1) : endTour()}
                className="flex-2 flex-grow-[2] py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
              >
                {tourStep < TOUR_STEPS.length - 1 ? 'Next →' : 'Got it!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 whitespace-nowrap">
          {undoToast.showTimer && <span className="w-6 h-6 rounded-full border-2 border-gray-500 text-gray-400 text-xs flex items-center justify-center shrink-0">{undoCountdown}</span>}
          <span className="text-sm">{undoToast.message}</span>
          <button onClick={handleUndo} className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors shrink-0"><Undo2 className="w-3.5 h-3.5" />Undo</button>
        </div>
      )}

      {/* Settings tray */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${showSettingsSheet ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={() => setShowSettingsSheet(false)}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${showSettingsSheet ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />
          <div className="px-1 pb-2">
            <button
              onClick={() => { setIsReorderMode(true); setShowSettingsSheet(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <span className="flex-1 text-left text-sm font-medium text-gray-800">Manage Habits</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <div className="h-px bg-gray-100 mx-4" />
            <button
              onClick={() => { exportBackup(); setShowSettingsSheet(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 text-green-600" />
              </div>
              <span className="flex-1 text-left text-sm font-medium text-gray-800">Download Backup</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <div className="h-px bg-gray-100 mx-4" />
            <button
              onClick={() => { fileInputRef.current?.click(); setShowSettingsSheet(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4 text-blue-600" />
              </div>
              <span className="flex-1 text-left text-sm font-medium text-gray-800">Restore from Backup</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <div className="h-px bg-gray-100 mx-4 mt-1" />
            <button
              onClick={() => setShowSettingsSheet(false)}
              className="w-full px-4 py-3.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-4">
            <p className="text-gray-700 text-sm mb-4 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2">
              <button onClick={confirmDialog.onConfirm} className={`flex-1 px-4 py-2 text-white rounded-xl text-sm font-semibold ${confirmDialog.confirmColor || 'bg-red-600 hover:bg-red-700'}`}>{confirmDialog.confirmLabel || 'Delete'}</button>
              <button onClick={() => setConfirmDialog(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Habit Tracker</h1>
          <p className="text-gray-600">Log your progress, stay motivated</p>
        </div>

        {/* Empty state */}
        {habits.length === 0 && (
          <div className={`bg-white rounded-2xl shadow-lg text-center ${isAddingHabit ? 'p-6' : 'p-12'}`}>
            {isAddingHabit ? (
              <form onSubmit={addHabit} className="flex flex-col gap-3 text-left">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newHabit}
                      onChange={(e) => { setNewHabit(e.target.value); if (nameError) setNameError(false); }}
                      placeholder="Habit name (max 12 chars)"
                      maxLength={12}
                      style={{ fontSize: '16px' }}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none text-sm ${nameError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-indigo-500'}`}
                      autoFocus
                    />
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg text-sm font-semibold shadow-md active:scale-95 shrink-0">Add</button>
                    <button type="button" onClick={() => { setIsAddingHabit(false); setNewHabit(''); setNameError(false); setNewHabitType('daily'); setNewHabitWeeklyTarget(3); setNewHabitMonthlyTarget(1); }} className="ml-1 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none shrink-0">×</button>
                  </div>
                  {nameError && <p className="text-red-500 text-xs px-1">Please enter a habit name</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                    <button type="button" onClick={() => setNewHabitType('daily')} className={`px-3 py-1 transition-colors ${newHabitType === 'daily' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Daily</button>
                    <button type="button" onClick={() => setNewHabitType('weekly')} className={`px-3 py-1 transition-colors ${newHabitType === 'weekly' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Weekly</button>
                    <button type="button" onClick={() => setNewHabitType('monthly')} className={`px-3 py-1 transition-colors ${newHabitType === 'monthly' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Monthly</button>
                  </div>
                  {newHabitType === 'weekly' && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <button type="button" onClick={() => setNewHabitWeeklyTarget(t => Math.max(1, t - 1))} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">−</button>
                      <span className="w-4 text-center font-semibold">{newHabitWeeklyTarget}</span>
                      <button type="button" onClick={() => setNewHabitWeeklyTarget(t => Math.min(7, t + 1))} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">+</button>
                      <span className="text-gray-400">days/wk</span>
                    </div>
                  )}
                  {newHabitType === 'monthly' && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <button type="button" onClick={() => setNewHabitMonthlyTarget(t => Math.max(1, t - 1))} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">−</button>
                      <span className="w-4 text-center font-semibold">{newHabitMonthlyTarget}</span>
                      <button type="button" onClick={() => setNewHabitMonthlyTarget(t => Math.min(30, t + 1))} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">+</button>
                      <span className="text-gray-400">days/mo</span>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <>
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Start Your Journey</h2>
                <p className="text-gray-500 mb-6">Add your first habit to begin tracking</p>
                <button
                  onClick={() => setIsAddingHabit(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Habit
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  Restore from backup
                </button>
              </>
            )}
          </div>
        )}

        {/* Hidden file input for backup restore */}
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />

        {/* Toolbar */}
        {habits.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            {isAddingHabit ? (
              <form onSubmit={addHabit} className="flex-1 bg-white rounded-xl shadow-md px-3 py-2 flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newHabit}
                      onChange={(e) => { setNewHabit(e.target.value); if (nameError) setNameError(false); }}
                      placeholder="Habit name (max 12 chars)"
                      maxLength={12}
                      style={{ fontSize: '16px' }}
                      className={`flex-1 px-2 py-1 border rounded-lg focus:outline-none text-sm ${nameError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-indigo-500'}`}
                      autoFocus
                    />
                    <button type="submit" className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg text-sm font-semibold shadow-md active:scale-95 shrink-0">Add</button>
                    <button type="button" onClick={() => { setIsAddingHabit(false); setNewHabit(''); setNameError(false); setNewHabitType('daily'); setNewHabitWeeklyTarget(3); setNewHabitMonthlyTarget(1); }} className="ml-2 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none shrink-0">×</button>
                  </div>
                  {nameError && <p className="text-red-500 text-xs px-1">Please enter a habit name</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                    <button type="button" onClick={() => setNewHabitType('daily')} className={`px-3 py-1 transition-colors ${newHabitType === 'daily' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Daily</button>
                    <button type="button" onClick={() => setNewHabitType('weekly')} className={`px-3 py-1 transition-colors ${newHabitType === 'weekly' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Weekly</button>
                    <button type="button" onClick={() => setNewHabitType('monthly')} className={`px-3 py-1 transition-colors ${newHabitType === 'monthly' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Monthly</button>
                  </div>
                  {newHabitType === 'weekly' && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <button type="button" onClick={() => setNewHabitWeeklyTarget(t => Math.max(1, t - 1))} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">−</button>
                      <span className="w-4 text-center font-semibold">{newHabitWeeklyTarget}</span>
                      <button type="button" onClick={() => setNewHabitWeeklyTarget(t => Math.min(7, t + 1))} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">+</button>
                      <span className="text-gray-400">days/wk</span>
                    </div>
                  )}
                  {newHabitType === 'monthly' && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <button type="button" onClick={() => setNewHabitMonthlyTarget(t => Math.max(1, t - 1))} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">−</button>
                      <span className="w-4 text-center font-semibold">{newHabitMonthlyTarget}</span>
                      <button type="button" onClick={() => setNewHabitMonthlyTarget(t => Math.min(30, t + 1))} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">+</button>
                      <span className="text-gray-400">days/mo</span>
                    </div>
                  )}
                </div>
              </form>
            ) : !isReorderMode ? (
              <button
                onClick={() => setIsAddingHabit(true)}
                className="px-4 h-10 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Habit
              </button>
            ) : <div />}
            {!isAddingHabit && !isReorderMode && (
              <button
                onClick={() => setShowSettingsSheet(true)}
                className="ml-auto w-10 h-10 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 transition-all inline-flex items-center justify-center shadow-md hover:shadow-lg"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            )}
            {!isAddingHabit && isReorderMode && (
              <button
                onClick={() => setIsReorderMode(false)}
                className="ml-auto px-3 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg">
                Finish
              </button>
            )}
          </div>
        )}

        {/* Habits grid */}
        <div className={viewMode === '2col' ? 'grid grid-cols-2 gap-x-3 gap-y-6' : 'space-y-1.5'}>
          {habits.map((habit, index) => {
            const streak = getStreakInfo(habit.dates);
            const daysSince = getDaysSinceLastLog(habit.dates);
            const loggedToday = isLoggedToday(habit.dates);
            const isExpanded = expandedHabits.has(habit.id);
            const isRenaming = renamingHabit === habit.id;
            const totalDays = getTotalDays(habit.id, habit.dates, habit.startDate);
            const loggedDays = habit.dates.length;

            return (
              <div key={habit.id} className={`relative overflow-visible transition-all ${viewMode === '2col' ? 'bg-white rounded-xl shadow-lg hover:shadow-xl' : isReorderMode ? 'bg-indigo-50/50 rounded-xl border border-indigo-100' : isExpanded ? 'bg-indigo-50/40 rounded-xl shadow-md border border-indigo-200' : 'bg-white rounded-xl shadow-md hover:shadow-md border border-gray-200'}`}>

                {/* 2-col: floating streak/gap badge */}
                {viewMode === '2col' && streak.current > 1 && (
                  <div className="absolute -top-4 -right-2 bg-gradient-to-r from-green-400 to-green-600 text-white text-sm font-normal px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 z-10">
                    🔥 {streak.current}d
                  </div>
                )}
                {viewMode === '2col' && streak.current <= 1 && daysSince !== null && daysSince > 0 && (
                  <div className={`absolute -top-4 -right-2 text-white text-sm font-normal px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 z-10 bg-gradient-to-r from-pink-300 to-red-400`}>
                    ⚠️ {daysSince}d
                  </div>
                )}

                {/* 1-col manage mode — single row */}
                {viewMode === '1col' && isReorderMode && (() => {
                  const habitType = habit.type || 'daily';
                  const habitTarget = habit.weeklyTarget || 3;
                  const monthlyHabitTarget = habit.monthlyTarget || 1;
                  const cycleType = () => {
                    const next = habitType === 'daily' ? 'weekly' : habitType === 'weekly' ? 'monthly' : 'daily';
                    updateHabitType(habit.id, next, next === 'weekly' ? 3 : next === 'monthly' ? 1 : undefined);
                  };
                  const currentTarget = habitType === 'weekly' ? habitTarget : monthlyHabitTarget;
                  const maxTarget = habitType === 'weekly' ? 7 : 30;
                  return (
                    <div className="flex items-center gap-1 px-2 py-2">
                      {/* ↑↓ arrows */}
                      {index > 0
                        ? <button onClick={() => moveHabitUp(index)} className="w-6 h-6 shrink-0 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold active:scale-95">↑</button>
                        : <span className="w-6 h-6 shrink-0" />}
                      {index < habits.length - 1
                        ? <button onClick={() => moveHabitDown(index)} className="w-6 h-6 shrink-0 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold active:scale-95">↓</button>
                        : <span className="w-6 h-6 shrink-0" />}
                      {/* Habit name */}
                      {isRenaming
                        ? <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => saveRename(habit.id)} onKeyPress={(e) => e.key === 'Enter' && e.target.blur()}
                            maxLength={12} style={{ fontSize: '16px' }}
                            className="flex-1 min-w-0 px-2 py-0.5 border-2 border-indigo-500 rounded-lg focus:outline-none text-sm" autoFocus />
                        : <span onClick={() => startRenaming(habit)} className="flex-1 min-w-0 font-bold text-xs text-gray-700 truncate cursor-pointer hover:text-indigo-600">{habit.name}</span>}
                      {/* Frequency chip — fixed-width column so all rows align */}
                      <div className="w-20 shrink-0 flex items-center gap-0.5 mx-2">
                        {habitType !== 'daily'
                          ? <button onClick={(e) => { e.stopPropagation(); updateHabitType(habit.id, habitType, Math.max(1, currentTarget - 1)); }}
                              className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold active:scale-95">−</button>
                          : <span className="w-5 shrink-0" />}
                        <button onClick={(e) => { e.stopPropagation(); cycleType(); }}
                          className="flex-1 text-center py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-600 hover:bg-indigo-200 active:scale-95">
                          {habitType === 'daily' ? 'Daily' : habitType === 'weekly' ? `${habitTarget}/wk` : `${monthlyHabitTarget}/mo`}
                        </button>
                        {habitType !== 'daily'
                          ? <button onClick={(e) => { e.stopPropagation(); updateHabitType(habit.id, habitType, Math.min(maxTarget, currentTarget + 1)); }}
                              className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold active:scale-95">+</button>
                          : <span className="w-5 shrink-0" />}
                      </div>
                      {/* Delete */}
                      <button onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                        className="shrink-0 w-14 py-1 rounded-lg text-[10px] font-semibold bg-red-100 text-red-700 hover:bg-red-200 active:scale-95 transition-all ml-1.5">Delete</button>
                    </div>
                  );
                })()}

                {/* 1-col: dense row */}
                {viewMode === '1col' && !isReorderMode && (() => {
                  const habitType = habit.type || 'daily';
                  const isWeekly = habitType === 'weekly';
                  const isMonthly = habitType === 'monthly';
                  const wTarget = habit.weeklyTarget || 3;
                  const mTarget = habit.monthlyTarget || 1;
                  const now = new Date(); now.setHours(0,0,0,0);
                  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

                  // Weekly-specific
                  const weeklyStreak = isWeekly ? getWeeklyStreakInfo(habit.dates, wTarget) : null;
                  const weeklyGap = isWeekly ? getWeeklyGap(habit.dates, wTarget) : null;
                  const weekDays = isWeekly ? getCurrentWeekDays() : null;
                  const weekGoalMet = isWeekly && weekDays && habit.dates.filter(d => weekDays.includes(d)).length >= wTarget;

                  // Monthly-specific
                  const monthlyStreak = isMonthly ? getMonthlyStreakInfo(habit.dates, mTarget) : null;
                  const monthlyGap = isMonthly ? getMonthlyGap(habit.dates, mTarget) : null;
                  const daysThisMonth = habit.dates.filter(d => d.startsWith(currentMonthStr)).length;
                  const monthGoalMet = isMonthly && daysThisMonth >= mTarget;

                  const goalAlreadyMet = (isWeekly && weekGoalMet) || (isMonthly && monthGoalMet);

                  const logBtn = (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!loggedToday) logToday(habit.id);
                      }}
                      className={`shrink-0 w-14 py-1.5 rounded-lg text-xs font-normal transition-all flex items-center justify-center gap-1 ${
                        loggedToday
                          ? 'bg-gradient-to-r from-green-200 to-green-300 text-green-700 cursor-default'
                          : goalAlreadyMet
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white active:scale-95 shadow-md'
                          : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white active:scale-95 shadow-md'
                      }`}
                    >
                      {loggedToday ? <><Check className="w-3 h-3" strokeWidth={2.5} />Done</> : goalAlreadyMet ? 'More?' : 'Done?'}
                    </button>
                  );

                  return (
                    <div
                      onClick={() => toggleHabitExpansion(habit.id)}
                      className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                    >
                      {/* Habit name + subtitle */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 truncate text-sm">{habit.name}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">
                          {isWeekly ? `Weekly · ${wTarget}/wk` : isMonthly ? `Monthly · ${mTarget}/mo` : 'Daily'}
                        </div>
                      </div>

                      {isWeekly ? (
                        <>
                          {/* Weekly streak/gap pill */}
                          <div className="w-16 flex justify-center shrink-0">
                            {weeklyStreak.current >= 1 ? (
                              <span className={`w-full text-center text-xs px-2 py-0.5 rounded-full text-white flex items-center justify-center gap-0.5 bg-gradient-to-r from-green-300 to-green-500`}><Rocket className="w-2.5 h-2.5" />{weeklyStreak.current}w</span>
                            ) : weeklyGap !== null && weeklyGap >= 1 ? (
                              <span className={`w-full text-center text-xs px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-pink-300 to-red-400`}>{weeklyGap}w gap</span>
                            ) : <span className="w-full" />}
                          </div>

                          {/* 7-circle weekly tracker */}
                          <div className="w-[90px] flex items-center justify-center gap-0.5 shrink-0 px-1 py-0.5 rounded-full">
                            {weekDays.map((dateStr, i) => {
                              const logged = habit.dates.includes(dateStr);
                              const future = dateStr > todayStr;
                              const isToday = dateStr === todayStr;
                              return (
                                <div key={i} className={`w-[10px] h-[10px] rounded-full flex items-center justify-center transition-all ${
                                  logged ? (weekGoalMet ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-indigo-400 to-blue-500') :
                                  !future ? 'bg-rose-100' :
                                  isToday ? 'border-2 border-indigo-400 bg-white' :
                                  'border border-gray-200 bg-white'
                                }`}>
                                  {logged && <Check className="w-1.5 h-1.5 text-white" strokeWidth={3} />}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : isMonthly ? (
                        <>
                          {/* Monthly streak/gap pill */}
                          <div className="w-16 flex justify-center shrink-0">
                            {monthlyStreak.current >= 1 ? (
                              <span className={`w-full text-center text-xs px-2 py-0.5 rounded-full text-white flex items-center justify-center gap-0.5 bg-gradient-to-r from-green-300 to-green-500`}><Rocket className="w-2.5 h-2.5" />{monthlyStreak.current}m</span>
                            ) : monthlyGap !== null && monthlyGap >= 1 ? (
                              <span className={`w-full text-center text-xs px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-pink-300 to-red-400`}>{monthlyGap}m gap</span>
                            ) : <span className="w-full" />}
                          </div>

                          {/* Monthly tracker */}
                          <div className={`w-[90px] flex items-center gap-1 shrink-0 px-1 py-0.5 rounded-full transition-all ${monthGoalMet ? 'text-green-500' : 'text-indigo-500'}`}>
                            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-bold whitespace-nowrap">{daysThisMonth}d this mo</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Daily streak/gap pill */}
                          <div className="w-16 flex justify-center shrink-0">
                            {streak.current > 1 ? (
                              <span className={`w-full text-center text-xs px-2 py-0.5 rounded-full text-white flex items-center justify-center gap-0.5 bg-gradient-to-r from-green-300 to-green-500`}><Rocket className="w-2.5 h-2.5" />{streak.current}d</span>
                            ) : daysSince !== null && daysSince > 0 ? (
                              <span className={`w-full text-center text-xs px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-pink-300 to-red-400`}>{daysSince}d gap</span>
                            ) : <span className="w-full" />}
                          </div>

                          {/* Daily tracker */}
                          <div className={`w-[90px] flex items-center gap-1 shrink-0 transition-colors ${loggedToday ? 'text-green-500' : 'text-indigo-500'}`}>
                            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-bold whitespace-nowrap">{daysThisMonth}d this mo</span>
                          </div>
                        </>
                      )}
                      {logBtn}
                    </div>
                  );
                })()}

                {/* 1-col: expanded heatmap */}
                {viewMode === '1col' && !isReorderMode && (
                  <div
                    style={{ display: 'grid', gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                    className="transition-[grid-template-rows] duration-300 ease-in-out"
                  >
                  <div className={`overflow-hidden transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="px-3 pb-3">
                    <div className="h-px bg-indigo-100 mb-2" />
                    {/* Stats row */}
                    {(() => {
                      const now = new Date();
                      const creation = new Date(parseInt(habit.startDate || habit.id));
                      const creationUTC = Date.UTC(creation.getFullYear(), creation.getMonth(), creation.getDate());
                      const earliestUTC = habit.dates.length ? dateToUTC([...habit.dates].sort()[0]) : creationUTC;
                      const startUTC = Math.min(earliestUTC, creationUTC);
                      const totalDaysVal = todayUTC() / 86400000 - startUTC / 86400000 + 1;
                      const start = new Date(startUTC);
                      const sinceLabel = start.toLocaleDateString('en-US', start.getUTCFullYear() === now.getFullYear() ? { month: 'short', day: 'numeric', timeZone: 'UTC' } : { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
                      const last30Dates = Array.from({ length: 30 }, (_, i) => {
                        const d = new Date(now); d.setDate(now.getDate() - i);
                        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                      });
                      const last30Logged = habit.dates.filter(d => last30Dates.includes(d)).length;
                      const last30Pct = Math.round((last30Logged / 30) * 100);
                      const isWeeklyHabit = habit.type === 'weekly';
                      const isMonthlyHabit = habit.type === 'monthly';
                      const wTarget = habit.weeklyTarget || 3;
                      const mTargetExp = habit.monthlyTarget || 1;
                      const wStreak = isWeeklyHabit ? getWeeklyStreakInfo(habit.dates, wTarget) : null;
                      const mStreakExp = isMonthlyHabit ? getMonthlyStreakInfo(habit.dates, mTargetExp) : null;
                      let weeksGoalMet = 0, totalWeeks = 0;
                      if (isWeeklyHabit) {
                        const startWeek = getWeekStart(new Date(startUTC));
                        const curWeek = getWeekStart(new Date());
                        totalWeeks = Math.round((curWeek.getTime() - startWeek.getTime()) / (7 * 86400000)) + 1;
                        for (let w = new Date(startWeek); w.getTime() <= curWeek.getTime(); w.setDate(w.getDate() + 7)) {
                          if (isWeekGoalMet(habit.dates, wTarget, new Date(w))) weeksGoalMet++;
                        }
                      }
                      let monthsGoalMet = 0, totalMonths = 0;
                      if (isMonthlyHabit) {
                        const startMonthStr = `${start.getUTCFullYear()}-${String(start.getUTCMonth()+1).padStart(2,'0')}`;
                        const curMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
                        totalMonths = (now.getFullYear() * 12 + now.getMonth()) - (start.getUTCFullYear() * 12 + start.getUTCMonth()) + 1;
                        let mm = startMonthStr;
                        for (let i = 0; i < totalMonths; i++) {
                          if (isMonthGoalMet(habit.dates, mTargetExp, mm)) monthsGoalMet++;
                          mm = nextMonthStr(mm);
                        }
                      }
                      return (
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          <div className="bg-white rounded-xl p-2 text-center border border-gray-100 shadow-md overflow-hidden">
                            <div className="text-[13px] font-bold text-indigo-600 whitespace-nowrap">{loggedDays} of {totalDaysVal}d</div>
                            <div className="text-[10px] text-gray-500 leading-tight mt-0.5 whitespace-nowrap">since {sinceLabel}</div>
                          </div>
                          <div className="bg-white rounded-xl p-2 text-center border border-gray-100 shadow-md overflow-hidden">
                            <div className="text-[13px] font-bold text-indigo-600 whitespace-nowrap">{isWeeklyHabit ? `${weeksGoalMet} of ${totalWeeks}w` : isMonthlyHabit ? `${monthsGoalMet} of ${totalMonths}m` : `${last30Logged}d`}</div>
                            <div className="text-[10px] text-gray-500 leading-tight mt-0.5 whitespace-nowrap">{isWeeklyHabit || isMonthlyHabit ? `since ${sinceLabel}` : 'in last 30 days'}</div>
                          </div>
                          <div className="bg-white rounded-xl p-2 text-center border border-gray-100 shadow-md overflow-hidden">
                            <div className="text-[13px] font-bold text-amber-500 whitespace-nowrap">🏆 {isWeeklyHabit ? `${wStreak.longest}w` : isMonthlyHabit ? `${mStreakExp.longest}m` : `${streak.longest}d`}</div>
                            <div className="text-[10px] text-gray-500 leading-tight mt-0.5">best streak</div>
                          </div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const today = new Date(); today.setHours(0, 0, 0, 0);
                      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                      let days = [], leadingBlanks = 0, monthLabel = null;
                      if (heatmapMode === '30d') {
                        days = Array.from({ length: 30 }, (_, i) => {
                          const d = new Date(today); d.setDate(today.getDate() - (29 - i));
                          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        });
                      } else {
                        const ref = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
                        const year = ref.getFullYear(); const month = ref.getMonth();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const isCurrentYear = year === today.getFullYear();
                        monthLabel = ref.toLocaleDateString('en-US', isCurrentYear ? { month: 'short' } : { month: 'short', year: 'numeric' });
                        leadingBlanks = new Date(year, month, 1).getDay();
                        days = Array.from({ length: daysInMonth }, (_, i) =>
                          `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
                        );
                      }
                      return (
                        <div className="bg-gray-50 rounded-lg p-1.5">
                          {heatmapMode === 'month' && (
                            <div className="flex items-center justify-between mb-1.5">
                              <button onClick={(e) => { e.stopPropagation(); setMonthOffset(o => o - 1); }} className="p-0.5 rounded hover:bg-gray-200 text-gray-500"><ChevronLeft className="w-3 h-3" /></button>
                              <span className="text-xs font-semibold text-gray-600">{monthLabel} ({days.filter(d => habit.dates.includes(d)).length}d)</span>
                              <button onClick={(e) => { e.stopPropagation(); setMonthOffset(o => o + 1); }} disabled={monthOffset >= 0} className="p-0.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"><ChevronRight className="w-3 h-3" /></button>
                            </div>
                          )}
                          {heatmapMode === 'month' && (
                            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                              {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="text-center text-[8px] font-semibold text-gray-400">{d}</div>)}
                            </div>
                          )}
                          <div className="grid grid-cols-7 gap-0.5">
                            {heatmapMode === 'month' && Array.from({ length: leadingBlanks }, (_, i) => <div key={`b-${i}`} />)}
                            {days.map(dateStr => {
                              const isLogged = habit.dates.includes(dateStr);
                              const isFuture = dateStr > todayStr;
                              const isToday = dateStr === todayStr;
                              return (
                                <button key={dateStr} disabled={isFuture}
                                  onClick={(e) => { e.stopPropagation(); !isFuture && toggleDate(habit.id, dateStr, isLogged); }}
                                  title={formatDate(dateStr)}
                                  className={`aspect-square rounded-sm transition-colors flex items-center justify-center ${
                                    isFuture ? 'bg-gray-100 cursor-default text-gray-300' :
                                    isLogged ? 'bg-indigo-500 hover:bg-indigo-600 text-white' :
                                    'bg-gray-200 hover:bg-gray-300 text-gray-500'
                                  } ${isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                                >
                                  <span className="text-[8px] font-medium leading-none select-none">{parseInt(dateStr.split('-')[2])}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleHabitExpansion(habit.id); }}
                      className="mt-2 w-full flex items-center justify-center py-1 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                  </div>
                  </div>
                )}

                {/* 2-col card front */}
                {viewMode === '2col' && (
                <div className="p-3">
                  <div className="mb-2">
                    {isRenaming ? (
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveRename(habit.id)} onKeyPress={(e) => e.key === 'Enter' && e.target.blur()}
                        className="w-full px-2 py-1 text-base border-2 border-indigo-500 rounded-lg focus:outline-none font-bold" autoFocus
                      />
                    ) : (
                      <h3 onClick={() => isReorderMode && startRenaming(habit)}
                        className={`font-bold text-gray-800 truncate text-base ${isReorderMode ? 'cursor-pointer hover:text-indigo-600' : ''} transition-colors`}>
                        {habit.name}
                      </h3>
                    )}
                  </div>
                  {!isReorderMode && (
                    <button
                      onClick={() => {
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                        loggedToday ? toggleDate(habit.id, todayStr, true) : logToday(habit.id);
                      }}
                      disabled={isRenaming}
                      className={`w-full px-3 py-2 rounded-lg font-normal transition-all text-sm mb-2 shadow-md hover:shadow-lg ${
                        isRenaming ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                        loggedToday ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white active:scale-95' :
                        'bg-gradient-to-r from-indigo-500 to-blue-600 text-white active:scale-95'
                      }`}
                    >
                      {loggedToday ? <span className="flex items-center justify-center gap-1"><Check className="w-4 h-4" />Done</span> : 'Log'}
                    </button>
                  )}
                  <div className="flex items-center">
                    <button
                      onClick={() => !isReorderMode && toggleHabitExpansion(habit.id)}
                      disabled={isReorderMode}
                      className={`w-full px-3 py-1.5 rounded-full text-sm font-normal inline-flex items-center justify-between border transition-colors ${
                        isExpanded ? 'bg-gradient-to-r from-indigo-400 to-blue-400 text-white border-transparent' : 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      {loggedDays} of {totalDays} days
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Heatmap */}
                  {!isReorderMode && isExpanded && (() => {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

                    let days = [];
                    let leadingBlanks = 0;
                    let monthLabel = null;

                    if (heatmapMode === '30d') {
                      days = Array.from({ length: 30 }, (_, i) => {
                        const d = new Date(today);
                        d.setDate(today.getDate() - (29 - i));
                        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                      });
                    } else {
                      const ref = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
                      const year = ref.getFullYear();
                      const month = ref.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const isCurrentYear = year === today.getFullYear();
                      monthLabel = ref.toLocaleDateString('en-US', isCurrentYear ? { month: 'short' } : { month: 'short', year: 'numeric' });
                      leadingBlanks = new Date(year, month, 1).getDay();
                      days = Array.from({ length: daysInMonth }, (_, i) =>
                        `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
                      );
                    }

                    return (
                      <div className="mt-2 bg-gray-50 rounded-lg p-2">
                        {heatmapMode === 'month' && (
                          <div className="flex items-center justify-between mb-2">
                            <button onClick={() => setMonthOffset(o => o - 1)} className="p-1 rounded hover:bg-gray-200 text-gray-500">
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-semibold text-gray-600">
                              {monthLabel} ({days.filter(d => habit.dates.includes(d)).length}d)
                            </span>
                            <button onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0} className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {heatmapMode === 'month' && (
                          <div className="grid grid-cols-7 gap-1 mb-1">
                            {['S','M','T','W','T','F','S'].map((d, i) => (
                              <div key={i} className="text-center text-[8px] font-semibold text-gray-400">{d}</div>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-7 gap-1">
                          {heatmapMode === 'month' && Array.from({ length: leadingBlanks }, (_, i) => (
                            <div key={`blank-${i}`} />
                          ))}
                          {days.map(dateStr => {
                            const isLogged = habit.dates.includes(dateStr);
                            const isFuture = dateStr > todayStr;
                            const isToday = dateStr === todayStr;
                            return (
                              <button
                                key={dateStr}
                                disabled={isFuture}
                                onClick={() => !isFuture && toggleDate(habit.id, dateStr, isLogged)}
                                title={formatDate(dateStr)}
                                className={`aspect-square rounded-sm transition-colors flex items-center justify-center ${
                                  isFuture ? 'bg-gray-100 cursor-default text-gray-300' :
                                  isLogged ? 'bg-indigo-500 hover:bg-indigo-600 text-white' :
                                  'bg-gray-200 hover:bg-gray-300 text-gray-500'
                                } ${isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                              >
                                <span className="text-[8px] font-medium leading-none select-none">
                                  {parseInt(dateStr.split('-')[2])}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                )}


              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
