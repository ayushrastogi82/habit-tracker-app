import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Check, TrendingUp, Calendar, ChevronDown, Info, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const viewMode = '1col';
  const [tourStep, setTourStep] = useState(null);
  const [feedbackFading, setFeedbackFading] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(() => localStorage.getItem('heatmap-mode') || 'month');
  const [monthOffset, setMonthOffset] = useState(0);

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
    if (success) { setHabits(updatedHabits); return true; }
    showFeedback('❌ Failed to save');
    return false;
  };

  const addHabit = async (e) => {
    if (e) e.preventDefault();
    const habitName = newHabit.trim();
    if (!habitName) { showFeedback('⚠️ Please enter a habit name'); return; }
    showFeedback('⏳ Adding...');
    const habit = { id: Date.now().toString(), name: habitName, dates: [] };
    const saved = await saveHabits([...habits, habit]);
    if (saved) { showFeedback('✅ Habit added!'); setNewHabit(''); setIsAddingHabit(false); }
  };

  const logToday = async (habitId) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const updated = habits.map(h =>
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
      confirmColor: 'bg-amber-500 hover:bg-amber-600',
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
      // Remove and show undo toast
      const updated = habits.map(h =>
        h.id === habitId ? { ...h, dates: h.dates.filter(d => d !== dateStr) } : h
      );
      await saveHabits(updated);
      if (undoToast?.timeoutId) clearTimeout(undoToast.timeoutId);
      const timeoutId = setTimeout(() => setUndoToast(null), 4000);
      setUndoToast({ type: 'date', habitId, date: dateStr, message: 'Date removed', timeoutId });
    } else {
      // Add date
      const updated = habits.map(h =>
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
    } else {
      await saveHabits(habits.map(h =>
        h.id === undoToast.habitId ? { ...h, dates: [...h.dates, undoToast.date].sort().reverse() } : h
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

  const getStreakInfo = (dates) => {
    if (!dates.length) return { current: 0, longest: 0 };
    const sorted = [...dates].sort().reverse();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    let current = 0;
    if (sorted[0] === today || sorted[0] === yesterdayStr) {
      current = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i-1]+'T00:00:00') - new Date(sorted[i]+'T00:00:00')) / 86400000;
        if (diff === 1) current++; else break;
      }
    }
    let longest = 0, temp = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i-1]+'T00:00:00') - new Date(sorted[i]+'T00:00:00')) / 86400000;
      if (diff === 1) temp++; else { longest = Math.max(longest, temp); temp = 1; }
    }
    longest = Math.max(longest, temp);
    return { current, longest };
  };

  const getDaysSinceLastLog = (dates) => {
    if (!dates.length) return null;
    const last = new Date(dates[0]+'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const missed = Math.floor((today - last) / 86400000) - 1;
    return missed > 0 ? missed : null;
  };

  const getTotalDays = (habitId, dates, startDate) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const creationDate = new Date(parseInt(startDate || habitId)); creationDate.setHours(0, 0, 0, 0);
    const earliestLog = dates.length ? new Date([...dates].sort()[0] + 'T00:00:00') : creationDate;
    const start = earliestLog < creationDate ? earliestLog : creationDate;
    return Math.floor((today - start) / 86400000) + 1;
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
          <button onClick={handleUndo} className="text-indigo-400 font-semibold text-sm hover:text-indigo-300">Undo</button>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <p className="text-gray-800 text-lg mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button onClick={confirmDialog.onConfirm} className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold ${confirmDialog.confirmColor || 'bg-red-600 hover:bg-red-700'}`}>{confirmDialog.confirmLabel || 'Delete'}</button>
              <button onClick={() => setConfirmDialog(null)} className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold">Cancel</button>
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
        {habits.length === 0 && !isAddingHabit && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
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
          </div>
        )}

        {/* Toolbar */}
        {habits.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            {isAddingHabit ? (
              <form onSubmit={addHabit} className="flex-1 bg-white rounded-xl shadow-md px-3 py-2 flex items-center gap-2">
                <input
                  type="text"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  placeholder="Habit name (max 15 chars)"
                  maxLength={15}
                  style={{ fontSize: '16px' }}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-sm"
                  autoFocus
                />
                <button type="submit" className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm active:scale-95 shrink-0">Add</button>
                <button type="button" onClick={() => { setIsAddingHabit(false); setNewHabit(''); }} className="ml-2 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none shrink-0">×</button>
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
            {!isAddingHabit && (
              <button
                onClick={() => setIsReorderMode(v => !v)}
                className={`ml-auto px-3 h-10 rounded-xl transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg ${
                  isReorderMode ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isReorderMode ? 'Finish' : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                )}
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
              <div key={habit.id} className={`relative overflow-visible transition-all ${viewMode === '2col' ? 'bg-white rounded-xl shadow-lg hover:shadow-xl' : isReorderMode ? 'bg-indigo-50/50 rounded-xl border border-indigo-100' : 'bg-white rounded-xl shadow-sm hover:shadow-md'}`}>

                {/* 2-col: floating streak/gap badge */}
                {viewMode === '2col' && streak.current > 1 && (
                  <div className="absolute -top-4 -right-2 bg-gradient-to-r from-green-400 to-green-600 text-white text-sm font-normal px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 z-10">
                    🔥 {streak.current}d
                  </div>
                )}
                {viewMode === '2col' && streak.current <= 1 && daysSince !== null && daysSince > 0 && (
                  <div className={`absolute -top-4 -right-2 text-white text-sm font-normal px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 z-10 bg-gradient-to-r ${
                    daysSince <= 3 ? 'from-amber-400 to-amber-600' :
                    daysSince <= 10 ? 'from-orange-400 to-orange-600' :
                    'from-red-400 to-red-600'
                  }`}>
                    ⚠️ {daysSince}d
                  </div>
                )}

                {/* 1-col manage mode */}
                {viewMode === '1col' && isReorderMode && (() => {
                  const now = new Date(); now.setHours(0,0,0,0);
                  const creationDate = new Date(parseInt(habit.startDate || habit.id)); creationDate.setHours(0,0,0,0);
                  const earliestLog = habit.dates.length ? new Date([...habit.dates].sort()[0] + 'T00:00:00') : creationDate;
                  const start = earliestLog < creationDate ? earliestLog : creationDate;
                  const sinceLabel = start.toLocaleDateString('en-US', start.getFullYear() === now.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
                  const displayName = habit.name.length > 15 ? habit.name.slice(0, 15) + '…' : habit.name;
                  return (
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      {isRenaming ? (
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => saveRename(habit.id)} onKeyPress={(e) => e.key === 'Enter' && e.target.blur()}
                          maxLength={15}
                          style={{ fontSize: '16px' }}
                          className="flex-1 px-2 py-1 border-2 border-indigo-500 rounded-lg focus:outline-none font-bold" autoFocus
                        />
                      ) : (
                        <span onClick={() => startRenaming(habit)} className="flex-1 font-bold text-gray-800 truncate text-sm cursor-pointer hover:text-indigo-600">{displayName}</span>
                      )}
                      <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">{loggedDays} of {totalDays}d since {sinceLabel}</span>
                    </div>
                  );
                })()}

                {/* 1-col: dense row */}
                {viewMode === '1col' && !isReorderMode && (() => {
                  const now = new Date();
                  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
                  const daysThisMonth = habit.dates.filter(d => d.startsWith(currentMonthStr)).length;
                  return (
                    <div
                      onClick={() => toggleHabitExpansion(habit.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50 rounded-t-xl' : ''}`}
                    >
                      {/* Habit name */}
                      <span className="flex-1 min-w-0 font-bold text-gray-800 truncate text-sm">{habit.name}</span>

                      {/* Streak or gap pill */}
                      <div className="w-16 flex justify-center shrink-0">
                        {streak.current > 1 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white whitespace-nowrap">🔥 {streak.current}d</span>
                        ) : daysSince !== null && daysSince > 0 ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white whitespace-nowrap bg-gradient-to-r ${
                            daysSince <= 3 ? 'from-amber-400 to-amber-600' :
                            daysSince <= 10 ? 'from-orange-400 to-orange-600' :
                            'from-red-400 to-red-600'
                          }`}>⚠️ {daysSince}d</span>
                        ) : <span />}
                      </div>

                      {/* Tracker: days this month */}
                      <div className="w-22 flex items-center gap-1 shrink-0 text-indigo-500">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-bold whitespace-nowrap">{daysThisMonth}d this mo</span>
                      </div>

                      {/* Log / Done button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const now = new Date();
                          const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                          loggedToday ? toggleDate(habit.id, todayStr, true) : logToday(habit.id);
                        }}
                        className={`shrink-0 w-14 py-1.5 rounded-lg text-xs font-normal transition-all flex items-center justify-center gap-1 ${
                          loggedToday ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white active:scale-95' :
                          'bg-gradient-to-r from-indigo-500 to-blue-600 text-white active:scale-95'
                        }`}
                      >
                        {loggedToday ? <><Check className="w-3.5 h-3.5" />Done</> : 'Done?'}
                      </button>
                    </div>
                  );
                })()}

                {/* 1-col: expanded heatmap */}
                {viewMode === '1col' && !isReorderMode && isExpanded && (
                  <div className="px-3 pb-3">
                    <div className="h-px bg-gray-100 mb-2" />
                    {/* Stats row */}
                    {(() => {
                      const now = new Date(); now.setHours(0,0,0,0);
                      const creationDate = new Date(parseInt(habit.startDate || habit.id)); creationDate.setHours(0,0,0,0);
                      const earliestLog = habit.dates.length ? new Date([...habit.dates].sort()[0] + 'T00:00:00') : creationDate;
                      const start = earliestLog < creationDate ? earliestLog : creationDate;
                      const totalDaysVal = Math.floor((now - start) / 86400000) + 1;
                      const sinceLabel = start.toLocaleDateString('en-US', start.getFullYear() === now.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
                      const last30Dates = Array.from({ length: 30 }, (_, i) => {
                        const d = new Date(now); d.setDate(now.getDate() - i);
                        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                      });
                      const last30Logged = habit.dates.filter(d => last30Dates.includes(d)).length;
                      const last30Pct = Math.round((last30Logged / 30) * 100);
                      const overallPct = totalDaysVal > 0 ? Math.round((loggedDays / totalDaysVal) * 100) : 0;
                      return (
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          <div className="bg-white rounded-xl p-2 text-center border border-gray-100 shadow-sm">
                            <div className="text-sm font-bold text-indigo-600">{loggedDays} of {totalDaysVal}d</div>
                            <div className="text-[10px] text-gray-400 leading-tight mt-0.5">since {sinceLabel}</div>
                          </div>
                          <div className="bg-white rounded-xl p-2 text-center border border-gray-100 shadow-sm">
                            <div className="text-sm font-bold text-indigo-600">{last30Logged}d</div>
                            <div className="text-[10px] text-gray-400 leading-tight mt-0.5">in last 30 days</div>
                          </div>
                          <div className="bg-white rounded-xl p-2 text-center border border-gray-100 shadow-sm">
                            <div className="text-sm font-bold text-amber-500">🏆 {streak.longest}d</div>
                            <div className="text-[10px] text-gray-400 leading-tight mt-0.5">best streak</div>
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

                {/* Reorder footer */}
                {isReorderMode && (
                  <div className="bg-gray-50 px-3 py-2 flex justify-between items-center border-t border-gray-200">
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button onClick={() => moveHabitUp(index)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95 transition-all">↑</button>
                      )}
                      {index < habits.length - 1 && (
                        <button onClick={() => moveHabitDown(index)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95 transition-all">↓</button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); resetHabit(habit.id); }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-95 transition-all"
                      >Reset</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 active:scale-95 transition-all"
                      >Delete</button>
                    </div>
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
