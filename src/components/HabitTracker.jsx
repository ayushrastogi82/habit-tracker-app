import React, { useState, useEffect } from 'react';
import { Plus, Check, TrendingUp, Calendar, ChevronDown } from 'lucide-react';

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
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [viewMode, setViewMode] = useState('2col');
  const [viewModeBeforeManage, setViewModeBeforeManage] = useState(null);

  useEffect(() => { loadHabits(); }, []);

  const showFeedback = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 3000);
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
    showFeedback('⏳ Logging...');
    const updated = habits.map(h =>
      h.id === habitId && !h.dates.includes(today)
        ? { ...h, dates: [...h.dates, today].sort().reverse() }
        : h
    );
    const saved = await saveHabits(updated);
    if (saved) showFeedback('✅ Logged!');
  };

  const deleteHabit = (habitId) => {
    setConfirmDialog({
      message: 'Delete this habit? All logged dates will be lost.',
      onConfirm: async () => {
        const saved = await saveHabits(habits.filter(h => h.id !== habitId));
        if (saved) showFeedback('✅ Habit deleted');
        setConfirmDialog(null);
      }
    });
  };

  const startRenaming = (habit) => { setRenamingHabit(habit.id); setEditName(habit.name); };

  const saveRename = async (habitId) => {
    const trimmedName = editName.trim();
    if (!trimmedName) { showFeedback('⚠️ Name cannot be empty'); setRenamingHabit(null); return; }
    const updated = habits.map(h => h.id === habitId ? { ...h, name: trimmedName } : h);
    await saveHabits(updated);
    setRenamingHabit(null);
    setEditName('');
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
      setUndoToast({ habitId, date: dateStr, timeoutId });
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
    const updated = habits.map(h =>
      h.id === undoToast.habitId
        ? { ...h, dates: [...h.dates, undoToast.date].sort().reverse() }
        : h
    );
    await saveHabits(updated);
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

  const getTotalDays = (habitId, dates) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const start = dates.length
      ? new Date([...dates].sort()[0]+'T00:00:00')
      : new Date(parseInt(habitId));
    start.setHours(0,0,0,0);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">

      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-xl shadow-lg z-50 font-semibold text-gray-800">
          {feedback}
        </div>
      )}

      {/* Undo toast */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3">
          <span className="text-sm">Date removed</span>
          <button onClick={handleUndo} className="text-indigo-400 font-semibold text-sm hover:text-indigo-300">Undo</button>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <p className="text-gray-800 text-lg mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button onClick={confirmDialog.onConfirm} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold">Delete</button>
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
          <div className="mb-6 flex justify-between items-center gap-2">
            {!isAddingHabit ? (
              <button
                onClick={() => setIsAddingHabit(true)}
                className="px-4 py-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors inline-flex items-center gap-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                Add Habit
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(v => v === '1col' ? '2col' : '1col')}
                disabled={isReorderMode}
                className={`px-3 py-2 rounded-xl transition-colors shadow-md ${isReorderMode ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title={viewMode === '1col' ? 'Switch to grid view' : 'Switch to list view'}
              >
                {viewMode === '1col' ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/>
                    <rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/>
                  </svg>
                )}
              </button>

              <button
                onClick={() => {
                if (!isReorderMode) {
                  setViewModeBeforeManage(viewMode);
                  setViewMode('1col');
                  setIsReorderMode(true);
                } else {
                  setViewMode(viewModeBeforeManage || '2col');
                  setViewModeBeforeManage(null);
                  setIsReorderMode(false);
                }
              }}
                className={`px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-2 shadow-md ${
                  isReorderMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
              {isReorderMode ? (
                <><Check className="w-4 h-4" />Done</>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              )}
              </button>
            </div>
          </div>
        )}

        {/* Add habit form */}
        {isAddingHabit && (
          <form onSubmit={addHabit} className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative">
            <button
              type="button"
              onClick={() => { setIsAddingHabit(false); setNewHabit(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
            >×</button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">New Habit</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                placeholder="e.g., Yoga, Clean Eating, Workout..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-base"
                autoFocus
              />
              <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold">
                Add
              </button>
            </div>
          </form>
        )}

        {/* Habits grid */}
        <div className={viewMode === '2col' ? 'grid grid-cols-2 gap-x-3 gap-y-6' : 'space-y-6'}>
          {habits.map((habit, index) => {
            const streak = getStreakInfo(habit.dates);
            const daysSince = getDaysSinceLastLog(habit.dates);
            const loggedToday = isLoggedToday(habit.dates);
            const isExpanded = expandedHabits.has(habit.id);
            const isRenaming = renamingHabit === habit.id;
            const totalDays = getTotalDays(habit.id, habit.dates);
            const loggedDays = habit.dates.length;

            return (
              <div key={habit.id} className={`relative bg-white overflow-visible ${viewMode === '2col' ? 'rounded-xl shadow-md' : 'rounded-2xl shadow-lg'}`}>
                {streak.current > 1 && (
                  <div className="absolute -top-4 -right-2 bg-gradient-to-r from-green-400 to-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 z-10">
                    🔥 {streak.current}d
                  </div>
                )}
                {streak.current <= 1 && daysSince !== null && daysSince > 0 && (
                  <div className={`absolute -top-4 -right-2 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 z-10 bg-gradient-to-r ${
                    daysSince <= 3 ? 'from-amber-400 to-amber-600' :
                    daysSince <= 10 ? 'from-orange-400 to-orange-600' :
                    'from-red-400 to-red-600'
                  }`}>
                    ⚠️ {daysSince}d
                  </div>
                )}

                {/* Card front */}
                <div className={viewMode === '2col' ? 'p-3' : 'p-5'}>

                  {/* Habit name */}
                  <div className="mb-2">
                    {isRenaming ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveRename(habit.id)}
                        onKeyPress={(e) => e.key === 'Enter' && e.target.blur()}
                        className="w-full px-2 py-1 text-base border-2 border-indigo-500 rounded-lg focus:outline-none font-bold"
                        autoFocus
                      />
                    ) : (
                      <h3
                        onClick={() => isReorderMode && startRenaming(habit)}
                        className={`font-bold text-gray-800 truncate ${viewMode === '2col' ? 'text-base' : 'text-xl'} ${isReorderMode ? 'cursor-pointer hover:text-indigo-600' : ''} transition-colors`}
                      >
                        {habit.name}
                      </h3>
                    )}
                  </div>

                  {/* Row 2: Log button */}
                  {!isReorderMode && (
                    <button
                      onClick={() => {
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                        loggedToday ? toggleDate(habit.id, todayStr, true) : logToday(habit.id);
                      }}
                      disabled={isRenaming}
                      className={`w-full px-3 py-2 rounded-lg font-semibold transition-all text-sm mb-2 ${
                        isRenaming ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                        loggedToday ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95' :
                        'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                      }`}
                    >
                      {loggedToday ? (
                        <span className="flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" />Done
                        </span>
                      ) : 'Log'}
                    </button>
                  )}

                  {/* Row 3: Tracker + streak/gap pills */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => !isReorderMode && toggleHabitExpansion(habit.id)}
                      disabled={isReorderMode}
                      className={`w-full px-3 py-1.5 rounded-full text-sm font-semibold inline-flex items-center justify-between border transition-colors ${
                        isExpanded
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      {loggedDays}/{totalDays} days
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                  </div>

                  {/* Heatmap */}
                  {!isReorderMode && isExpanded && (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const days = Array.from({ length: 30 }, (_, i) => {
                      const d = new Date(today);
                      d.setDate(today.getDate() - (29 - i));
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    });
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                    const streakStart = new Date(today);
                    streakStart.setDate(today.getDate() - (streak.current - 1));
                    const streakStartStr = `${streakStart.getFullYear()}-${String(streakStart.getMonth()+1).padStart(2,'0')}-${String(streakStart.getDate()).padStart(2,'0')}`;
                    return (
                      <div className="mt-2 bg-gray-50 rounded-lg p-2">
                        <div className="grid grid-cols-7 gap-1">
                          {days.map(dateStr => {
                            const isLogged = habit.dates.includes(dateStr);
                            const isFuture = dateStr > todayStr;
                            const isToday = dateStr === todayStr;
                            const isInStreak = streak.current > 1 && isLogged && dateStr >= streakStartStr && dateStr <= todayStr;
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

                {/* Reorder footer */}
                {isReorderMode && (
                  <div className="bg-gray-50 px-3 py-2 flex justify-between items-center border-t border-gray-200">
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button onClick={() => moveHabitUp(index)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95 font-bold">↑</button>
                      )}
                      {index < habits.length - 1 && (
                        <button onClick={() => moveHabitDown(index)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95 font-bold">↓</button>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                      className="text-red-600 hover:text-red-700 text-xs font-medium active:scale-95"
                    >Delete</button>
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
