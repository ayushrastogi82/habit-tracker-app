import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Check, TrendingUp, Calendar, ChevronDown, ChevronLeft, ChevronRight, Undo2, Download, Upload, MoreHorizontal, Share2, Moon, Sun } from 'lucide-react';
import ShareModal from './ShareModal';
import Onboarding from './Onboarding';

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
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding-seen'));
  const [feedbackFading, setFeedbackFading] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(() => localStorage.getItem('heatmap-mode') || 'month');
  const [weekStart, setWeekStart] = useState(() => parseInt(localStorage.getItem('week-start') || '0')); // 0=Sun, 1=Mon
  const [monthOffset, setMonthOffset] = useState(0);
  const [viewDateOffset, setViewDateOffset] = useState(0); // 0 = today, -1 = yesterday, etc.
  const [heatmapStates, setHeatmapStates] = useState(() => {
    // Restore saved view (year/month) per habit from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('heatmap-views') || '{}');
      const states = {};
      Object.entries(saved).forEach(([id, view]) => {
        states[id] = { view, yearOffset: 0, monthOffset: 0 };
      });
      return states;
    } catch { return {}; }
  }); // per-habit: { view:'year'|'month', yearOffset:0, monthOffset:0 }
  const [nameError, setNameError] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [shareHabit, setShareHabit] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const override = localStorage.getItem('dark-mode-override');
    if (override !== null) return override === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const fileInputRef = React.useRef(null);

  const BACKUP_REMINDER_DAYS = 5;

  useEffect(() => { loadHabits(); }, []);
  useEffect(() => {
    // Reload at midnight so date-dependent calculations (streaks, logged today) stay fresh
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timer = setTimeout(() => window.location.reload(), midnight - now);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (localStorage.getItem('dark-mode-override') === null) {
        setDarkMode(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  useEffect(() => { if (habits.length === 0) setIsReorderMode(false); }, [habits.length]);
  useEffect(() => {
    const last = localStorage.getItem('lastBackupDate');
    if (!last) return; // never backed up — don't nag until they've backed up once
    const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= BACKUP_REMINDER_DAYS) setShowBackupReminder(true);
  }, []);
  useEffect(() => {
    if (!undoToast?.showTimer) { setUndoCountdown(undoToast?.duration || 4); return; }
    setUndoCountdown(undoToast.duration);
    const interval = setInterval(() => {
      setUndoCountdown(c => (c <= 1 ? (clearInterval(interval), 0) : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [undoToast]);

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

  const exportBackup = async () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits,
      preferences: { heatmapMode, weekStart },
    };
    const json = JSON.stringify(backup, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `habit-backup-${date}.json`;

    // iOS PWA: a.download is silently ignored — use Web Share API with files instead
    const isIOSPWA = window.navigator.standalone === true;
    if (isIOSPWA && navigator.share && navigator.canShare) {
      const file = new File([json], fileName, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Beacon Backup' });
          localStorage.setItem('lastBackupDate', new Date().toISOString());
          setShowBackupReminder(false);
          showFeedback('✅ Backup shared!');
        } catch (e) {
          if (e.name !== 'AbortError') showFeedback('❌ Share failed');
        }
        return;
      }
    }

    // Desktop / Android / Safari browser: standard blob download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    localStorage.setItem('lastBackupDate', new Date().toISOString());
    setShowBackupReminder(false);
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
          message: `Restore ${parsed.habits.length} habit${parsed.habits.length !== 1 ? 's' : ''} from backup${parsed.exportedAt ? ` (saved ${new Date(parsed.exportedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })})` : ''}? This will replace all your current data.`,
          confirmLabel: 'Restore',
          confirmColor: 'bg-indigo-600 hover:bg-indigo-700',
          onConfirm: async () => {
            setConfirmDialog(null);
            await saveHabits(parsed.habits);
            if (parsed.preferences?.heatmapMode) {
              setHeatmapMode(parsed.preferences.heatmapMode);
              localStorage.setItem('heatmap-mode', parsed.preferences.heatmapMode);
            }
            if (parsed.preferences?.weekStart !== undefined) {
              setWeekStart(parsed.preferences.weekStart);
              localStorage.setItem('week-start', parsed.preferences.weekStart);
            }
            showFeedback(`🎉 ${parsed.habits.length} habit${parsed.habits.length !== 1 ? 's' : ''} restored!`);
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
      setNewHabit(''); setIsAddingHabit(false); setIsReorderMode(false);
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
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun … 6=Sat
    const diff = weekStart === 1 ? (day === 0 ? 6 : day - 1) : day;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>

      {/* Feedback toast */}
      {feedback && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-6 py-3 rounded-xl shadow-lg z-50 font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap transition-opacity duration-300 ${feedbackFading ? 'opacity-0' : 'opacity-100'}`}>
          {feedback}
        </div>
      )}

      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding
          darkMode={darkMode}
          onDone={() => {
            localStorage.setItem('onboarding-seen', 'true');
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Undo toast */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 whitespace-nowrap">
          {undoToast.showTimer && <span className="w-6 h-6 rounded-full border-2 border-gray-500 text-gray-400 text-xs flex items-center justify-center shrink-0">{undoCountdown}</span>}
          <span className="text-sm">{undoToast.message}</span>
          <button onClick={handleUndo} className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors shrink-0"><Undo2 className="w-3.5 h-3.5" />Undo</button>
        </div>
      )}

      {/* Share modal */}
      {shareHabit && <ShareModal habit={shareHabit} onClose={() => setShareHabit(null)} />}

      {/* Settings tray */}
      <div
        className={`fixed z-50 transition-opacity duration-200 ${showSettingsSheet ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', top: 'env(safe-area-inset-top)', left: 0, right: 0, bottom: 0 }}
        onClick={() => setShowSettingsSheet(false)}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ${showSettingsSheet ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-md mx-auto">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-2" />
            <div className="px-1 pb-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={() => { setIsReorderMode(true); setShowSettingsSheet(false); }}
                disabled={habits.length === 0}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 rounded-xl transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <span className="flex-1 text-left text-sm font-medium text-gray-800 dark:text-gray-100">Manage Habits</span>
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
              <button
                onClick={() => { exportBackup(); setShowSettingsSheet(false); }}
                disabled={habits.length === 0}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 rounded-xl transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-gray-800 dark:text-gray-100">Download Backup</span>
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
              <button
                onClick={() => { fileInputRef.current?.click(); setShowSettingsSheet(false); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-gray-800 dark:text-gray-100">Restore from Backup</span>
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
              <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  {darkMode ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <span className="flex-1 text-left text-sm font-medium text-gray-800 dark:text-gray-100">Dark Mode</span>
                <button
                  onClick={() => setDarkMode(d => { const next = !d; localStorage.setItem('dark-mode-override', String(next)); return next; })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">Week starts on</span>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {[{ val: 0, label: 'Sun' }, { val: 1, label: 'Mon' }].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => { const v = val; setWeekStart(v); localStorage.setItem('week-start', v); }}
                      className={`px-3 py-1 text-xs font-semibold transition-colors ${weekStart === val ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2">
              <button onClick={confirmDialog.onConfirm} className={`flex-1 px-4 py-2 text-white rounded-xl text-sm font-semibold ${confirmDialog.confirmColor || 'bg-red-600 hover:bg-red-700'}`}>{confirmDialog.confirmLabel || 'Delete'}</button>
              <button onClick={() => setConfirmDialog(null)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">

        {/* Header — large centered when empty, compact with controls when habits exist */}
        {habits.length === 0 && !isAddingHabit ? (
          <div className="text-center mb-8">
            <div className="text-[20px] font-bold tracking-widest uppercase text-indigo-500 dark:text-indigo-400">Beacon</div>
            <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">Habit tracking simplified</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-indigo-100 dark:border-gray-800">
            {!isReorderMode
              ? <button onClick={() => setIsAddingHabit(true)} disabled={isAddingHabit}
                  className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-40">
                  <Plus className="w-4 h-4" />
                </button>
              : <div className="w-8 shrink-0" />}
            <div className="flex-1 text-center">
              <div className="text-[20px] font-bold tracking-widest uppercase text-indigo-500 dark:text-indigo-400 leading-tight">Beacon</div>
              <div className="text-xs font-medium text-gray-400 dark:text-gray-500 leading-tight mt-0.5">Habit tracking simplified</div>
            </div>
            {isReorderMode
              ? <button onClick={() => setIsReorderMode(false)}
                  className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 active:scale-95">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </button>
              : <button onClick={() => setShowSettingsSheet(true)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 active:scale-95">
                  <MoreHorizontal className="w-4 h-4" />
                </button>}
          </div>
        )}

        {/* Inline add habit form */}
        {isAddingHabit && (
          <form onSubmit={addHabit} className="bg-white dark:bg-gray-900 rounded-xl shadow-md px-3 py-3 flex flex-col gap-2 mb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newHabit}
                  onChange={(e) => { setNewHabit(e.target.value); if (nameError) setNameError(false); }}
                  placeholder="Habit name (max 20 chars)"
                  maxLength={20}
                  style={{ fontSize: '16px' }}
                  className={`flex-1 px-2 py-1 border rounded-lg focus:outline-none text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${nameError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'}`}
                  autoFocus
                />
                <button type="submit" className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg text-sm font-semibold shadow-md active:scale-95 shrink-0">Add</button>
                <button type="button" onClick={() => { setIsAddingHabit(false); setNewHabit(''); setNameError(false); setNewHabitType('daily'); setNewHabitWeeklyTarget(3); setNewHabitMonthlyTarget(1); }} className="ml-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold leading-none shrink-0">×</button>
              </div>
              {nameError && <p className="text-red-500 text-xs px-1">Please enter a habit name</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
                <button type="button" onClick={() => setNewHabitType('daily')} className={`px-3 py-1 transition-colors ${newHabitType === 'daily' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Daily</button>
                <button type="button" onClick={() => setNewHabitType('weekly')} className={`px-3 py-1 transition-colors ${newHabitType === 'weekly' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Weekly</button>
                <button type="button" onClick={() => setNewHabitType('monthly')} className={`px-3 py-1 transition-colors ${newHabitType === 'monthly' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Monthly</button>
              </div>
              {newHabitType === 'weekly' && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <button type="button" onClick={() => setNewHabitWeeklyTarget(t => Math.max(1, t - 1))} className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center font-bold">−</button>
                  <span className="w-4 text-center font-semibold">{newHabitWeeklyTarget}</span>
                  <button type="button" onClick={() => setNewHabitWeeklyTarget(t => Math.min(7, t + 1))} className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center font-bold">+</button>
                  <span className="text-gray-400 dark:text-gray-500">days/wk</span>
                </div>
              )}
              {newHabitType === 'monthly' && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <button type="button" onClick={() => setNewHabitMonthlyTarget(t => Math.max(1, t - 1))} className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center font-bold">−</button>
                  <span className="w-4 text-center font-semibold">{newHabitMonthlyTarget}</span>
                  <button type="button" onClick={() => setNewHabitMonthlyTarget(t => Math.min(30, t + 1))} className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center font-bold">+</button>
                  <span className="text-gray-400 dark:text-gray-500">days/mo</span>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Backup reminder banner */}
        {showBackupReminder && habits.length > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3">
            <span className="text-lg shrink-0">💾</span>
            <p className="flex-1 text-xs text-amber-800 dark:text-amber-300 font-medium">No backup in {BACKUP_REMINDER_DAYS}+ days. Download one to stay safe.</p>
            <button
              onClick={() => { exportBackup(); }}
              className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Backup
            </button>
            <button
              onClick={() => setShowBackupReminder(false)}
              className="shrink-0 text-amber-400 hover:text-amber-600 text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>
        )}

        {/* Empty state */}
        {habits.length === 0 && !isAddingHabit && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg text-center p-12">
            <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Start Your Journey</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first habit to get started</p>
            <button
              onClick={() => setIsAddingHabit(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md active:scale-95 mb-4 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Habit
            </button>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                Restore from backup
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input for backup restore */}
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />


        {/* Date navigator */}
        {(() => {
          const _now = new Date(); _now.setHours(0,0,0,0);
          const _vd = new Date(_now); _vd.setDate(_now.getDate() + viewDateOffset);
          const _vdStr = _vd.toISOString().slice(0,10);
          const _label = viewDateOffset === 0 ? 'Today'
            : viewDateOffset === -1 ? 'Yesterday'
            : _vd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const _isPast = viewDateOffset < 0;
          return (
            <div className={`flex items-center justify-between px-1 mb-2 ${_isPast ? 'py-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50' : ''}`}>
              <button onClick={() => setViewDateOffset(o => o - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 active:scale-95 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                {_isPast && <span className="text-xs">📅</span>}
                <span className={`text-xs font-semibold ${_isPast ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {_label}
                </span>
                {_isPast && (
                  <button onClick={() => setViewDateOffset(0)}
                    className="text-[10px] font-medium text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline ml-1">
                    back to today
                  </button>
                )}
              </div>
              <button onClick={() => setViewDateOffset(o => Math.min(0, o + 1))}
                disabled={viewDateOffset >= 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 disabled:opacity-20 active:scale-95 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* Habits grid */}
        <div className={viewMode === '2col' ? 'grid grid-cols-2 gap-x-3 gap-y-6' : 'space-y-1.5'}>
          {habits.map((habit, index) => {
            const _nowBase = new Date(); _nowBase.setHours(0,0,0,0);
            const viewDate = new Date(_nowBase); viewDate.setDate(_nowBase.getDate() + viewDateOffset);
            const viewDateStr = viewDate.toISOString().slice(0,10);
            const isViewingToday = viewDateOffset === 0;
            const streak = getStreakInfo(habit.dates);
            const daysSince = getDaysSinceLastLog(habit.dates);
            const loggedToday = habit.dates.includes(viewDateStr);
            const isExpanded = expandedHabits.has(habit.id);
            const isRenaming = renamingHabit === habit.id;
            const totalDays = getTotalDays(habit.id, habit.dates, habit.startDate);
            const loggedDays = habit.dates.length;

            return (
              <div key={habit.id} className={`relative overflow-visible transition-all ${viewMode === '2col' ? 'bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-xl' : isReorderMode ? 'bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900' : isExpanded ? 'bg-indigo-50/40 dark:bg-indigo-950/30 rounded-xl shadow-md border border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-md border border-gray-200 dark:border-gray-800'}`}>

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
                    <div className="flex items-center gap-2 pl-2 pr-2 py-2">
                      {/* ↑↓ arrows — always visible, grayed when disabled */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => moveHabitUp(index)} disabled={index === 0}
                          className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${index === 0 ? 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-default' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 active:scale-95'}`}>↑</button>
                        <button onClick={() => moveHabitDown(index)} disabled={index === habits.length - 1}
                          className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${index === habits.length - 1 ? 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-default' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 active:scale-95'}`}>↓</button>
                      </div>
                      {/* Habit name */}
                      {isRenaming
                        ? <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => saveRename(habit.id)} onKeyPress={(e) => e.key === 'Enter' && e.target.blur()}
                            maxLength={20} style={{ fontSize: '16px' }}
                            className="flex-1 min-w-0 px-2 py-0.5 border-2 border-indigo-500 rounded-lg focus:outline-none text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" autoFocus />
                        : <span onClick={() => startRenaming(habit)} className="flex-1 min-w-0 font-medium text-xs text-gray-700 dark:text-gray-200 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400">{habit.name}</span>}
                      {/* Frequency chip — fixed-width column so all rows align */}
                      <div className="w-20 shrink-0 flex items-center gap-0.5 ml-2 mr-1">
                        {habitType !== 'daily'
                          ? <button onClick={(e) => { e.stopPropagation(); updateHabitType(habit.id, habitType, Math.max(1, currentTarget - 1)); }}
                              className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold active:scale-95">−</button>
                          : <span className="w-5 shrink-0" />}
                        <button onClick={(e) => { e.stopPropagation(); cycleType(); }}
                          className="flex-1 text-center py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900 active:scale-95">
                          {habitType === 'daily' ? 'Daily' : habitType === 'weekly' ? `${habitTarget}/wk` : `${monthlyHabitTarget}/mo`}
                        </button>
                        {habitType !== 'daily'
                          ? <button onClick={(e) => { e.stopPropagation(); updateHabitType(habit.id, habitType, Math.min(maxTarget, currentTarget + 1)); }}
                              className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold active:scale-95">+</button>
                          : <span className="w-5 shrink-0" />}
                      </div>
                      {/* Delete */}
                      <button onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                        className="shrink-0 w-14 py-1 rounded-lg text-[10px] font-semibold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950 active:scale-95 transition-all ml-1.5">Delete</button>
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
                        toggleDate(habit.id, viewDateStr, loggedToday);
                      }}
                      className={`shrink-0 self-center h-8 w-14 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                        loggedToday
                          ? 'bg-gradient-to-r from-green-200 to-green-300 text-green-700 active:scale-95'
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
                      className="flex items-stretch gap-2 px-3 py-2 cursor-pointer"
                    >
                      {/* Left: name + type label */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                        <div className="font-bold text-gray-800 dark:text-gray-100 truncate text-sm">{habit.name}</div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {isWeekly ? `Weekly · ${wTarget}/wk` : isMonthly ? `Monthly · ${mTarget}/mo` : 'Daily'}
                        </span>
                      </div>

                      {/* Middle: streak/gap pill (top) + tracker (bottom) — same column, right-aligned, extra gap before Done */}
                      <div className="flex flex-col justify-center items-end gap-0.5 shrink-0 mr-1.5">
                        {/* Streak/gap pill — fixed w-16 so all pills are same width */}
                        {isWeekly ? (
                          weeklyStreak.current >= 1
                            ? <span className={`w-16 py-0.5 rounded-full text-xs font-semibold flex items-center justify-center gap-0.5 ${weekGoalMet ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>{weeklyStreak.current}w<span className="text-[8px]">🔗</span></span>
                            : weeklyGap !== null && weeklyGap >= 1 ? <span className="w-16 py-0.5 rounded-full text-xs font-semibold flex items-center justify-center bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">{weeklyGap}w off</span> : <div className="w-16" />
                        ) : isMonthly ? (
                          monthlyStreak.current >= 1
                            ? <span className={`w-16 py-0.5 rounded-full text-xs font-semibold flex items-center justify-center gap-0.5 ${monthGoalMet ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>{monthlyStreak.current}m<span className="text-[8px]">🔗</span></span>
                            : monthlyGap !== null && monthlyGap >= 1 ? <span className="w-16 py-0.5 rounded-full text-xs font-semibold flex items-center justify-center bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">{monthlyGap}m off</span> : <div className="w-16" />
                        ) : (
                          streak.current > 1
                            ? <span className={`w-16 py-0.5 rounded-full text-xs font-semibold flex items-center justify-center gap-0.5 ${loggedToday ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>{streak.current}d<span className="text-[8px]">🔗</span></span>
                            : daysSince !== null && daysSince > 0 ? <span className="w-16 py-0.5 rounded-full text-xs font-semibold flex items-center justify-center bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">{daysSince}d off</span> : <div className="w-16" />
                        )}

                        {/* Tracker */}
                        {isWeekly ? (
                          <div className="flex items-center justify-center gap-0.5">
                            {weekDays.map((dateStr, i) => {
                              const logged = habit.dates.includes(dateStr);
                              const future = dateStr > todayStr;
                              const isToday = dateStr === todayStr;
                              return (
                                <div key={i} className={`w-[10px] h-[10px] rounded-full flex items-center justify-center transition-all ${
                                  logged ? (weekGoalMet ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-indigo-400 to-blue-500')
                                  : isToday ? 'border-2 border-indigo-400 bg-white dark:bg-gray-900'
                                  : !future ? 'bg-rose-100 dark:bg-rose-950/50'
                                  : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                                }`}>
                                  {logged && <Check className="w-1.5 h-1.5 text-white" strokeWidth={3} />}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={`flex items-center gap-1 ${(isMonthly ? monthGoalMet : loggedToday) ? 'text-green-500 dark:text-green-400' : 'text-indigo-500 dark:text-indigo-400'}`}>
                            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-bold whitespace-nowrap">{daysThisMonth}d this mo</span>
                          </div>
                        )}
                      </div>

                      {/* Done button — spans full card height */}
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
                  <div className="px-2 pb-2">
                    <div className="h-px bg-indigo-100 dark:bg-indigo-900 mb-2" />

                    {/* HEATMAP — year or month view, per-habit independent state */}
                    {(() => {
                      const today = new Date(); today.setHours(0, 0, 0, 0);
                      const todayStr = today.toISOString().slice(0, 10);
                      const dates = habit.dates || [];
                      const isWeeklyHabit = habit.type === 'weekly';
                      const isMonthlyHabit = habit.type === 'monthly';
                      const wTarget = habit.weeklyTarget || 3;
                      const mTarget = habit.monthlyTarget || 1;

                      // Per-habit state
                      const hs = heatmapStates[habit.id] || { view: 'month', yearOffset: 0, monthOffset: 0 };
                      const setHS = (patch) => setHeatmapStates(s => {
                        const prev = s[habit.id] || { view: 'year', yearOffset: 0, monthOffset: 0 };
                        const next = { ...prev, ...patch };
                        const updated = { ...s, [habit.id]: next };
                        if (patch.view !== undefined) {
                          try {
                            const views = {};
                            Object.entries(updated).forEach(([id, st]) => { views[id] = st.view; });
                            localStorage.setItem('heatmap-views', JSON.stringify(views));
                          } catch {}
                        }
                        return updated;
                      });

                      const GAP = 1;
                      const availW = window.innerWidth - 60;

                      // ── YEAR VIEW ──────────────────────────────────────────
                      const selectedYear = today.getFullYear() + hs.yearOffset;
                      const isCurrentYear = selectedYear === today.getFullYear();
                      const jan1 = new Date(selectedYear, 0, 1);
                      const jan1Dow = jan1.getDay();
                      const leadingDays = weekStart === 1 ? (jan1Dow === 0 ? 6 : jan1Dow - 1) : jan1Dow;
                      const gridStart = new Date(selectedYear, 0, 1 - leadingDays);
                      const dec31 = new Date(selectedYear, 11, 31);
                      const YEAR_WEEKS = Math.ceil(((dec31 - gridStart) / 86400000 + 1) / 7);
                      const DOT_YEAR = Math.max(4, (availW - (YEAR_WEEKS - 1) * GAP) / YEAR_WEEKS);

                      const yearGrid = Array.from({ length: YEAR_WEEKS }, (_, w) =>
                        Array.from({ length: 7 }, (_, d) => {
                          const date = new Date(gridStart);
                          date.setDate(gridStart.getDate() + w * 7 + d);
                          const ds = date.toISOString().slice(0, 10);
                          const inYear = ds.startsWith(String(selectedYear));
                          return { logged: inYear && dates.includes(ds), outOfYear: !inYear, isToday: ds === todayStr };
                        })
                      );

                      let actCount = 0;
                      if (isWeeklyHabit) {
                        const yearEnd = new Date(selectedYear, 11, 31);
                        for (let w = new Date(getWeekStart(new Date(selectedYear, 0, 1))); w <= yearEnd; w.setDate(w.getDate() + 7)) {
                          if (w.getFullYear() <= selectedYear && isWeekGoalMet(dates, wTarget, new Date(w))) actCount++;
                        }
                      } else if (isMonthlyHabit) {
                        for (let m = 0; m < 12; m++) {
                          if (isMonthGoalMet(dates, mTarget, `${selectedYear}-${String(m + 1).padStart(2, '0')}`)) actCount++;
                        }
                      } else {
                        actCount = yearGrid.flat().filter(c => !c.outOfYear && c.logged).length;
                      }

                      const canGoBack = dates.some(d => d.startsWith(String(selectedYear - 1)));
                      const canGoForward = !isCurrentYear;

                      // ── MONTH VIEW ─────────────────────────────────────────
                      const refDate = new Date(today.getFullYear(), today.getMonth() + hs.monthOffset, 1);
                      const mYear = refDate.getFullYear();
                      const mMonth = refDate.getMonth();
                      const mStr = `${mYear}-${String(mMonth + 1).padStart(2, '0')}`;
                      const MONTH_NAMES_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                      const firstDow = refDate.getDay();
                      const mLeading = weekStart === 1 ? (firstDow === 0 ? 6 : firstDow - 1) : firstDow;
                      const mGridStart = new Date(mYear, mMonth, 1 - mLeading);
                      const daysInMonth = new Date(mYear, mMonth + 1, 0).getDate();
                      const MONTH_WEEKS = Math.ceil((mLeading + daysInMonth) / 7);
                      // Month view: cells fill full width (like year) but use same height as year dots
                      const DOT_MONTH_W = Math.max(4, (availW - (MONTH_WEEKS - 1) * GAP) / MONTH_WEEKS);
                      const DOT_MONTH_H = DOT_YEAR;

                      const monthGrid = Array.from({ length: MONTH_WEEKS }, (_, w) =>
                        Array.from({ length: 7 }, (_, d) => {
                          const date = new Date(mGridStart);
                          date.setDate(mGridStart.getDate() + w * 7 + d);
                          const ds = date.toISOString().slice(0, 10);
                          const inMonth = ds.startsWith(mStr);
                          return { logged: inMonth && dates.includes(ds), outOfMonth: !inMonth, isToday: ds === todayStr };
                        })
                      );
                      const mCount = monthGrid.flat().filter(c => !c.outOfMonth && c.logged).length;
                      const canGoMonthBack = hs.monthOffset > -120;
                      const canGoMonthForward = hs.monthOffset < 0;

                      // ── SHARED ─────────────────────────────────────────────
                      let totalAllTime = 0;
                      if (isWeeklyHabit) {
                        const allWeekStarts = new Set(dates.map(d => getWeekStart(new Date(d)).toISOString().slice(0, 10)));
                        allWeekStarts.forEach(ws => { if (isWeekGoalMet(dates, wTarget, new Date(ws))) totalAllTime++; });
                      } else if (isMonthlyHabit) {
                        const allMonths = new Set(dates.map(d => d.slice(0, 7)));
                        allMonths.forEach(ms => { if (isMonthGoalMet(dates, mTarget, ms)) totalAllTime++; });
                      } else {
                        totalAllTime = dates.length;
                      }

                      const bestStreak = isWeeklyHabit
                        ? getWeeklyStreakInfo(dates, wTarget).longest
                        : isMonthlyHabit
                        ? getMonthlyStreakInfo(dates, mTarget).longest
                        : getStreakInfo(dates).longest;
                      const streakUnit = isWeeklyHabit ? 'wk' : isMonthlyHabit ? 'mo' : 'd';
                      const countUnit = isWeeklyHabit ? 'wk' : isMonthlyHabit ? 'mo' : 'd';

                      const dotStyle = (day, outKey) => ({
                        borderRadius: '1px',
                        boxSizing: 'border-box',
                        ...(!day[outKey] && day.isToday ? { border: day.logged ? '1.5px solid #22c55e' : '1.5px solid #6366f1' } : {}),
                      });
                      const dotClass = (day, outKey) =>
                        day[outKey] ? 'bg-transparent' : day.logged
                          ? 'bg-indigo-500 dark:bg-indigo-400'
                          : 'bg-gray-200 dark:bg-gray-700';

                      // ── PERIOD CHIPS ────────────────────────────────────────
                      // All years (incl. current) → year chips; current year months → month chips
                      const chipCurrentYear = today.getFullYear();
                      const chipCurrentMonth = today.getMonth();
                      const earliestYear = dates.length ? parseInt([...dates].sort()[0].slice(0, 4)) : chipCurrentYear;
                      const allYearChips = Array.from({ length: chipCurrentYear - earliestYear + 1 }, (_, i) => earliestYear + i);
                      const currentYearMonthChips = Array.from({ length: chipCurrentMonth + 1 }, (_, i) => i); // 0=Jan … chipCurrentMonth

                      // Active: year chip when view=year, month chip when view=month
                      const chipActiveYear = hs.view === 'year' ? selectedYear : null;
                      const chipActiveMonth = hs.view === 'month' ? mMonth : null;

                      return (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 mb-2">
                          {/* Unified scrollable period chips — no toggle, no share */}
                          <div
                            ref={el => {
                              if (!el) return;
                              const active = el.querySelector('[data-chip-active="true"]');
                              if (active) {
                                // Scroll only within the chip container — never touch page scroll
                                el.scrollLeft = active.offsetLeft + active.offsetWidth / 2 - el.offsetWidth / 2;
                              }
                            }}
                            className="flex gap-1 overflow-x-auto mb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {/* Year chips (all years including current) */}
                            {allYearChips.map(year => {
                              const isActive = chipActiveYear === year;
                              return (
                                <button key={`y-${year}`}
                                  data-chip-active={isActive ? 'true' : undefined}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHS({ view: 'year', yearOffset: year - chipCurrentYear });
                                    const c = e.currentTarget.parentElement;
                                    c.scrollTo({ left: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2 - c.offsetWidth / 2, behavior: 'smooth' });
                                  }}
                                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                    isActive
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  }`}>
                                  {year}
                                </button>
                              );
                            })}
                            {/* Current year month chips */}
                            {currentYearMonthChips.map(monthIdx => {
                              const isActive = chipActiveMonth === monthIdx && mYear === chipCurrentYear;
                              const monthOffset = monthIdx - chipCurrentMonth;
                              return (
                                <button key={`m-${monthIdx}`}
                                  data-chip-active={isActive ? 'true' : undefined}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHS({ view: 'month', yearOffset: 0, monthOffset });
                                    const c = e.currentTarget.parentElement;
                                    c.scrollTo({ left: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2 - c.offsetWidth / 2, behavior: 'smooth' });
                                  }}
                                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                    isActive
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  }`}>
                                  {MONTH_NAMES_FULL[monthIdx].slice(0, 3)}
                                </button>
                              );
                            })}
                          </div>

                          {/* Grid */}
                          {hs.view === 'year' ? (
                            <div className="flex gap-px">
                              {yearGrid.map((week, wi) => (
                                <div key={wi} className="flex flex-col gap-px shrink-0">
                                  {week.map((day, di) => (
                                    <div key={di} style={{ width: `${DOT_YEAR}px`, height: `${DOT_YEAR}px`, ...dotStyle(day, 'outOfYear') }}
                                      className={dotClass(day, 'outOfYear')} />
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex gap-px">
                              {monthGrid.map((week, wi) => (
                                <div key={wi} className="flex flex-col gap-px shrink-0">
                                  {week.map((day, di) => (
                                    <div key={di} style={{ width: `${DOT_MONTH_W}px`, height: `${DOT_MONTH_H}px`, borderRadius: '1px', boxSizing: 'border-box', ...( !day.outOfMonth && day.isToday ? { border: day.logged ? '1.5px solid #22c55e' : '1.5px solid #6366f1' } : {}) }}
                                      className={dotClass(day, 'outOfMonth')} />
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Footer — two-tier: numbers bold+dark, labels readable */}
                          <div className="flex items-baseline gap-1.5 flex-wrap mt-2">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              {hs.view === 'year' ? actCount : mCount}{countUnit}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              in {hs.view === 'year' ? selectedYear : MONTH_NAMES_FULL[mMonth].slice(0,3)}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-600">·</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{totalAllTime}{countUnit}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">total</span>
                            <span className="text-xs text-gray-400 dark:text-gray-600 mx-0.5">·</span>
                            <span className="text-sm font-bold text-amber-500 dark:text-amber-400">🏆 {bestStreak}{streakUnit}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">best</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. MILESTONE + SHARE — celebration then action, always at bottom */}
                    {(() => {
                      const MILESTONES = [7, 21, 30, 50, 100, 200, 365];
                      const MILESTONE_COPY = {
                        7:   "Most people quit by day 3. You're still here.",
                        21:  "You're building something real.",
                        30:  "This is becoming part of who you are.",
                        50:  "Quiet consistency is underrated.",
                        100: "That's not a streak — that's a lifestyle.",
                        200: "You showed up more than most people ever will.",
                        365: "Some people start habits. You built one.",
                      };
                      const EARLY_COPY = [
                        "Log your first day — every streak starts here.",
                        "Day 1 done. The hardest part is starting.",
                        "2 days in. You're already ahead of most.",
                        "3 days — you're building a real pattern.",
                        "4 days. Don't stop now.",
                        "5 days in. Your first milestone is close.",
                        "6 days. One more and you hit your first milestone!",
                      ];
                      const lastMilestone = [...MILESTONES].reverse().find(m => m <= habit.dates.length);
                      const earlyMotivation = !lastMilestone ? EARLY_COPY[Math.min(habit.dates.length, 6)] : null;
                      return (lastMilestone || earlyMotivation) ? (
                        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg px-3 py-2 border border-indigo-100 dark:border-indigo-900/50 overflow-hidden">
                          <span className="text-sm shrink-0">🎯</span>
                          {lastMilestone && <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 shrink-0">{habit.dates.length}d</span>}
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 truncate">{lastMilestone ? MILESTONE_COPY[lastMilestone] : earlyMotivation}</span>
                        </div>
                      ) : null;
                    })()}

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
                        toggleDate(habit.id, viewDateStr, loggedToday);
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
                      leadingBlanks = weekStart === 1
                        ? (new Date(year, month, 1).getDay() + 6) % 7
                        : new Date(year, month, 1).getDay();
                      days = Array.from({ length: daysInMonth }, (_, i) =>
                        `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
                      );
                    }
                    const dayLabels2 = weekStart === 1 ? ['M','T','W','T','F','S','S'] : ['S','M','T','W','T','F','S'];

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
                            {dayLabels2.map((d, i) => (
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
