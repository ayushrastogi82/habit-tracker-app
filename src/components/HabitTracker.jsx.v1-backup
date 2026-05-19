import React, { useState, useEffect } from 'react';
import { Plus, Check, TrendingUp, Calendar } from 'lucide-react';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedHabits, setExpandedHabits] = useState(new Set());
  const [feedback, setFeedback] = useState('');
  const [renamingHabit, setRenamingHabit] = useState(null);
  const [editName, setEditName] = useState('');
  const [showingDatePicker, setShowingDatePicker] = useState(null);
  const [newDateForHabit, setNewDateForHabit] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [viewMode, setViewMode] = useState('2col'); // '1col' or '2col'
  const [viewModeBeforeReorder, setViewModeBeforeReorder] = useState(null);

  useEffect(() => {
    loadHabits();
  }, []);

  const showFeedback = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 3000);
  };

  const loadHabits = async () => {
    try {
      // Try window.storage first
      if (window.storage) {
        const result = await window.storage.get('habits-data');
        if (result && result.value) {
          setHabits(JSON.parse(result.value));
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log('Window storage failed, trying localStorage');
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('habits-data');
      if (stored) {
        setHabits(JSON.parse(stored));
      }
    } catch (error) {
      console.log('LocalStorage also failed');
    }
    setLoading(false);
  };

  const saveHabits = async (updatedHabits) => {
    let success = false;

    // Try window.storage first
    try {
      if (window.storage) {
        await window.storage.set('habits-data', JSON.stringify(updatedHabits));
        success = true;
      }
    } catch (error) {
      console.log('Window storage save failed');
    }

    // Always also save to localStorage as backup
    try {
      localStorage.setItem('habits-data', JSON.stringify(updatedHabits));
      success = true;
    } catch (error) {
      console.log('LocalStorage save failed');
    }

    if (success) {
      setHabits(updatedHabits);
      return true;
    } else {
      showFeedback('❌ Failed to save');
      return false;
    }
  };

  const addHabit = async (e) => {
    if (e) e.preventDefault();

    const habitName = newHabit.trim();
    if (!habitName) {
      showFeedback('⚠️ Please enter a habit name');
      return;
    }

    showFeedback('⏳ Adding...');

    const habit = {
      id: Date.now().toString(),
      name: habitName,
      dates: []
    };

    const updatedHabits = [...habits, habit];
    const saved = await saveHabits(updatedHabits);

    if (saved) {
      showFeedback('✅ Habit added!');
      setNewHabit('');
      setIsAddingHabit(false);
    }
  };

  const logToday = async (habitId) => {
    // Get today's date in local timezone as YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    showFeedback('⏳ Logging...');

    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        if (!habit.dates.includes(today)) {
          return { ...habit, dates: [...habit.dates, today].sort().reverse() };
        }
      }
      return habit;
    });

    const saved = await saveHabits(updatedHabits);
    if (saved) {
      showFeedback('✅ Logged!');
    }
  };

  const deleteHabit = async (habitId) => {
    setConfirmDialog({
      message: 'Delete this habit? All logged dates will be lost.',
      onConfirm: async () => {
        const updated = habits.filter(h => h.id !== habitId);
        const saved = await saveHabits(updated);
        if (saved) {
          showFeedback('✅ Habit deleted');
        }
        setConfirmDialog(null);
      }
    });
  };

  const startRenaming = (habit) => {
    setRenamingHabit(habit.id);
    setEditName(habit.name);
  };

  const saveRename = async (habitId) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      showFeedback('⚠️ Name cannot be empty');
      setRenamingHabit(null);
      return;
    }

    const updatedHabits = habits.map(h =>
      h.id === habitId ? { ...h, name: trimmedName } : h
    );

    await saveHabits(updatedHabits);
    setRenamingHabit(null);
    setEditName('');
    showFeedback('✅ Renamed!');
  };

  const addCustomDate = async (habitId, dateValue) => {
    if (!dateValue) {
      showFeedback('⚠️ Please select a date');
      return;
    }

    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        if (!habit.dates.includes(dateValue)) {
          return { ...habit, dates: [...habit.dates, dateValue].sort().reverse() };
        } else {
          showFeedback('⚠️ Date already logged');
          return habit;
        }
      }
      return habit;
    });

    const saved = await saveHabits(updatedHabits);
    if (saved) {
      setNewDateForHabit({ ...newDateForHabit, [habitId]: '' });
      setShowingDatePicker(null);
      showFeedback('✅ Date added!');
    }
  };

  const handleDateChange = (habitId, dateValue) => {
    if (dateValue) {
      addCustomDate(habitId, dateValue);
    }
  };

  const deleteDate = async (habitId, dateToDelete) => {
    setConfirmDialog({
      message: 'Delete this date?',
      onConfirm: async () => {
        const updatedHabits = habits.map(habit => {
          if (habit.id === habitId) {
            return { ...habit, dates: habit.dates.filter(d => d !== dateToDelete) };
          }
          return habit;
        });

        const saved = await saveHabits(updatedHabits);
        if (saved) {
          showFeedback('✅ Date deleted');
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const reorderedHabits = [...habits];
    const [removed] = reorderedHabits.splice(draggedIndex, 1);
    reorderedHabits.splice(dropIndex, 0, removed);

    await saveHabits(reorderedHabits);
    setDraggedIndex(null);
    showFeedback('✅ Reordered');
  };

  const handleTouchStart = (e, index) => {
    setDraggedIndex(index);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e, index) => {
    if (draggedIndex === null) return;

    const currentY = e.touches[0].clientY;
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();

    // Check if touch is over this element
    if (currentY >= rect.top && currentY <= rect.bottom) {
      setDragOverIndex(index);
    }
  };

  const handleTouchEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setTouchStartY(null);
      return;
    }

    if (draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setTouchStartY(null);
      return;
    }

    const reorderedHabits = [...habits];
    const [removed] = reorderedHabits.splice(draggedIndex, 1);
    reorderedHabits.splice(dragOverIndex, 0, removed);

    await saveHabits(reorderedHabits);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchStartY(null);
    showFeedback('✅ Reordered');
  };

  const moveHabitUp = async (index) => {
    if (index === 0) return;

    const reorderedHabits = [...habits];
    const [removed] = reorderedHabits.splice(index, 1);
    reorderedHabits.splice(index - 1, 0, removed);

    await saveHabits(reorderedHabits);
    showFeedback('✅ Moved up');
  };

  const moveHabitDown = async (index) => {
    if (index === habits.length - 1) return;

    const reorderedHabits = [...habits];
    const [removed] = reorderedHabits.splice(index, 1);
    reorderedHabits.splice(index + 1, 0, removed);

    await saveHabits(reorderedHabits);
    showFeedback('✅ Moved down');
  };

  const toggleReorderMode = () => {
    if (!isReorderMode) {
      // Entering reorder mode - save current view and switch to 1-col
      setViewModeBeforeReorder(viewMode);
      setViewMode('1col');
      setIsReorderMode(true);
    } else {
      // Exiting reorder mode - restore previous view
      if (viewModeBeforeReorder) {
        setViewMode(viewModeBeforeReorder);
        setViewModeBeforeReorder(null);
      }
      setIsReorderMode(false);
    }
  };

  const toggleHabitExpansion = (habitId) => {
    setExpandedHabits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(habitId)) {
        newSet.delete(habitId);
      } else {
        newSet.add(habitId);
      }
      return newSet;
    });
  };

  const getDaysSinceLastLog = (dates) => {
    if (dates.length === 0) return null;
    const lastDate = new Date(dates[0] + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today - lastDate;
    const daysSinceLastLog = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Gap = completed days missed. Today isn't over yet, so subtract 1
    const daysMissed = daysSinceLastLog - 1;
    return daysMissed > 0 ? daysMissed : null;
  };

  const getTotalDaysSinceCreation = (habitId, dates) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate;
    if (dates.length > 0) {
      // Use earliest logged date
      const sortedDates = [...dates].sort();
      startDate = new Date(sortedDates[0] + 'T00:00:00');
    } else {
      // Use creation date (habitId is a timestamp)
      startDate = new Date(parseInt(habitId));
    }

    startDate.setHours(0, 0, 0, 0);
    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include today
    return diffDays;
  };

  const getStreakInfo = (dates) => {
    if (dates.length === 0) return { current: 0, longest: 0 };

    const sortedDates = [...dates].sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Get today in local timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // Only count streak if logged TODAY (not yesterday)
    if (sortedDates[0] === today) {
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1] + 'T00:00:00');
        const currDate = new Date(sortedDates[i] + 'T00:00:00');
        const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1] + 'T00:00:00');
      const currDate = new Date(sortedDates[i] + 'T00:00:00');
      const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  };

  const formatDate = (dateStr) => {
    // Parse YYYY-MM-DD as local date, not UTC
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isLoggedToday = (dates) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    return dates.includes(today);
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
      {feedback && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-xl shadow-lg z-50 font-semibold text-gray-800">
          {feedback}
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <p className="text-gray-800 text-lg mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Habit Tracker</h1>
          <p className="text-gray-600">Log your progress, stay motivated</p>
        </div>

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
            ) : <div></div>}

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === '1col' ? '2col' : '1col')}
                disabled={isReorderMode}
                className={`px-3 py-2 rounded-xl transition-colors shadow-md ${
                  isReorderMode
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title={isReorderMode ? 'Exit reorder mode to change view' : viewMode === '1col' ? 'Switch to grid view' : 'Switch to list view'}
              >
                {viewMode === '1col' ? (
                  // Grid icon for switching to 2-col
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <rect x="2" y="2" width="7" height="7" rx="1"/>
                    <rect x="11" y="2" width="7" height="7" rx="1"/>
                    <rect x="2" y="11" width="7" height="7" rx="1"/>
                    <rect x="11" y="11" width="7" height="7" rx="1"/>
                  </svg>
                ) : (
                  // List icon for switching to 1-col
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="5" x2="17" y2="5"/>
                    <line x1="3" y1="10" x2="17" y2="10"/>
                    <line x1="3" y1="15" x2="17" y2="15"/>
                  </svg>
                )}
              </button>

              <button
                onClick={toggleReorderMode}
                className={`px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-2 shadow-md ${
                  isReorderMode
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title={isReorderMode ? 'Done reordering' : 'Reorder habits'}
              >
                {isReorderMode ? (
                  <>
                    <Check className="w-5 h-5" />
                    Done
                  </>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M10 3 L10 17 M7 6 L10 3 L13 6 M7 14 L10 17 L13 14"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {isAddingHabit && (
          <form onSubmit={addHabit} className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative">
            <button
              type="button"
              onClick={() => {
                setIsAddingHabit(false);
                setNewHabit('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
            >
              ×
            </button>
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
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
              >
                Add
              </button>
            </div>
          </form>
        )}

        <div className={viewMode === '2col' ? 'grid grid-cols-2 gap-3' : 'space-y-4'}>
          {habits.map((habit, index) => {
            const daysSince = getDaysSinceLastLog(habit.dates);
            const streak = getStreakInfo(habit.dates);
            const loggedToday = isLoggedToday(habit.dates);
            const isExpanded = expandedHabits.has(habit.id);
            const isRenaming = renamingHabit === habit.id;
            const isShowingDatePicker = showingDatePicker === habit.id;
            const totalDays = getTotalDaysSinceCreation(habit.id, habit.dates);
            const loggedDays = habit.dates.length;

            return (
              <div
                key={habit.id}
                className={viewMode === '2col'
                  ? "bg-white rounded-xl shadow-md overflow-hidden"
                  : "bg-white rounded-2xl shadow-lg overflow-hidden"
                }
              >
                <div className={viewMode === '2col' ? 'p-3' : 'p-6'}>
                  <div className={viewMode === '2col' ? 'flex items-start gap-2 mb-2' : 'flex items-start gap-3 mb-4'}>
                    <div className="flex-1 min-w-0">
                      {isRenaming ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => saveRename(habit.id)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          className={`w-full ${viewMode === '2col' ? 'px-2 py-1 text-base mb-1' : 'px-3 py-2 text-xl mb-2'} border-2 border-indigo-500 rounded-${viewMode === '2col' ? 'lg' : 'xl'} focus:outline-none font-bold`}
                          autoFocus
                        />
                      ) : (
                        <h3
                          onClick={() => !isReorderMode && startRenaming(habit)}
                          className={`${viewMode === '2col' ? 'text-base mb-1 line-clamp-2' : 'text-2xl mb-2'} font-bold text-gray-800 break-words ${!isReorderMode ? 'cursor-pointer hover:text-indigo-600' : ''} transition-colors`}
                        >
                          {habit.name}
                        </h3>
                      )}

                      <div className={`${viewMode === '2col' ? 'flex flex-col gap-1 text-xs' : 'flex flex-wrap gap-2 text-sm'}`}>
                        <div className="flex items-center gap-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <TrendingUp className={viewMode === '2col' ? 'w-3 h-3' : 'w-4 h-4 text-indigo-600'} />
                            <span className="text-gray-600">
                              {loggedDays}/{totalDays} {viewMode === '1col' && 'days'}
                            </span>
                          </div>
                          {streak.current > 0 && (
                            <div className={`${viewMode === '2col' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} bg-green-100 text-green-700 rounded-full font-semibold inline-flex items-center gap-1`}>
                              🔥 {streak.current}d
                            </div>
                          )}
                          {daysSince !== null && daysSince > 0 && (
                            <div className={`${viewMode === '2col' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-semibold ${
                              daysSince === 1 ? 'bg-yellow-100 text-yellow-700' :
                              daysSince <= 3 ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {daysSince}d gap
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isReorderMode && viewMode === '1col' && (
                      <button
                        onClick={() => logToday(habit.id)}
                        disabled={loggedToday || isRenaming}
                        className={`px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                          isRenaming
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : loggedToday
                            ? 'bg-green-500 text-white cursor-default'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                        }`}
                      >
                        {loggedToday ? (
                          <span className="flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            Done
                          </span>
                        ) : (
                          'Log'
                        )}
                      </button>
                    )}
                  </div>

                  {!isReorderMode && viewMode === '2col' && (
                    <button
                      onClick={() => logToday(habit.id)}
                      disabled={loggedToday || isRenaming}
                      className={`w-full px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                        isRenaming
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : loggedToday
                          ? 'bg-green-500 text-white cursor-default'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                      }`}
                    >
                      {loggedToday ? (
                        <span className="flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" />
                          Done
                        </span>
                      ) : (
                        'Log'
                      )}
                    </button>
                  )}

                  {!isReorderMode && (
                    <>
                      {habit.dates.length === 0 ? (
                        // For empty habits: show inline "Add past date"
                        <div className={viewMode === '2col' ? 'mt-2' : 'mt-3'}>
                          <button
                            onClick={() => {
                              setShowingDatePicker(habit.id);
                              const now = new Date();
                              setSelectedMonth(String(now.getMonth() + 1));
                              setSelectedDay(String(now.getDate()));
                            }}
                            className={`text-indigo-600 hover:text-indigo-700 font-medium ${viewMode === '2col' ? 'text-xs' : 'text-sm'} active:scale-95`}
                          >
                            + Add past dates
                          </button>

                          {isShowingDatePicker && (
                            <div className={`bg-gray-50 ${viewMode === '2col' ? 'rounded-lg p-2 mt-2' : 'rounded-xl p-4 mt-3'}`}>
                              <div className={`flex ${viewMode === '2col' ? 'flex-col' : 'gap-2 items-center'} ${viewMode === '2col' ? 'gap-2' : ''} ${viewMode === '2col' ? 'mb-2' : 'mb-3'}`}>
                                <select
                                  value={selectedMonth}
                                  onChange={(e) => {
                                    setSelectedMonth(e.target.value);
                                  }}
                                  className={`${viewMode === '2col' ? 'w-full text-xs' : 'flex-1 text-base'} px-${viewMode === '2col' ? '2' : '3'} py-${viewMode === '2col' ? '2' : '3'} border-2 border-indigo-500 rounded-lg focus:outline-none font-medium`}
                                >
                                  <option value="">Month</option>
                                  {viewMode === '2col' ? (
                                    <>
                                      <option value="1">Jan</option>
                                      <option value="2">Feb</option>
                                      <option value="3">Mar</option>
                                      <option value="4">Apr</option>
                                      <option value="5">May</option>
                                      <option value="6">Jun</option>
                                      <option value="7">Jul</option>
                                      <option value="8">Aug</option>
                                      <option value="9">Sep</option>
                                      <option value="10">Oct</option>
                                      <option value="11">Nov</option>
                                      <option value="12">Dec</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="1">January</option>
                                      <option value="2">February</option>
                                      <option value="3">March</option>
                                      <option value="4">April</option>
                                      <option value="5">May</option>
                                      <option value="6">June</option>
                                      <option value="7">July</option>
                                      <option value="8">August</option>
                                      <option value="9">September</option>
                                      <option value="10">October</option>
                                      <option value="11">November</option>
                                      <option value="12">December</option>
                                    </>
                                  )}
                                </select>
                                <select
                                  value={selectedDay}
                                  onChange={(e) => {
                                    setSelectedDay(e.target.value);
                                  }}
                                  className={`${viewMode === '2col' ? 'w-full text-xs' : 'flex-1 text-base'} px-${viewMode === '2col' ? '2' : '3'} py-${viewMode === '2col' ? '2' : '3'} border-2 border-indigo-500 rounded-lg focus:outline-none font-medium`}
                                >
                                  <option value="">Day</option>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>{day}</option>
                                  ))}
                                </select>
                                {viewMode === '2col' ? (
                                  <div className="flex gap-2">
                                    {selectedMonth && selectedDay && (
                                      <button
                                        onClick={() => {
                                          const now = new Date();
                                          const year = now.getFullYear();
                                          const dateStr = `${year}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
                                          handleDateChange(habit.id, dateStr);
                                          // Reset to today but keep picker open
                                          const today = new Date();
                                          setSelectedMonth(String(today.getMonth() + 1));
                                          setSelectedDay(String(today.getDate()));
                                        }}
                                        className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs"
                                      >
                                        Add
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setShowingDatePicker(null);
                                        setSelectedMonth('');
                                        setSelectedDay('');
                                      }}
                                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {selectedMonth && selectedDay && (
                                      <button
                                        onClick={() => {
                                          const now = new Date();
                                          const year = now.getFullYear();
                                          const dateStr = `${year}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
                                          handleDateChange(habit.id, dateStr);
                                          // Reset to today but keep picker open
                                          const today = new Date();
                                          setSelectedMonth(String(today.getMonth() + 1));
                                          setSelectedDay(String(today.getDate()));
                                        }}
                                        className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold"
                                      >
                                        Add
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setShowingDatePicker(null);
                                        setSelectedMonth('');
                                        setSelectedDay('');
                                      }}
                                      className="px-3 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold"
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // For habits with dates: show Show/Hide pattern
                        <div className={viewMode === '2col' ? 'mt-2' : 'mt-0'}>
                          <div className={`flex items-center justify-between ${viewMode === '2col' ? 'mb-2' : 'mb-3'}`}>
                            <button
                              onClick={() => toggleHabitExpansion(habit.id)}
                              className={`text-indigo-600 hover:text-indigo-700 font-medium ${viewMode === '2col' ? 'text-xs' : 'text-sm'} active:scale-95`}
                            >
                              {isExpanded ? '▼ Hide' : viewMode === '2col' ? '▶ Show' : '▶ Show dates'}
                            </button>

                            {isExpanded && (
                              <button
                                onClick={() => {
                                  setShowingDatePicker(habit.id);
                                  const now = new Date();
                                  setSelectedMonth(String(now.getMonth() + 1));
                                  setSelectedDay(String(now.getDate()));
                                }}
                                className={`text-indigo-600 hover:text-indigo-700 font-medium ${viewMode === '2col' ? 'text-xs' : 'text-sm'} active:scale-95`}
                              >
                                + Add{viewMode === '1col' && ' Date'}
                              </button>
                            )}
                          </div>

                          {isExpanded && (
                            <div className={`bg-gray-50 ${viewMode === '2col' ? 'rounded-lg p-2' : 'rounded-xl p-4'}`}>
                              {isShowingDatePicker && (
                            <div className={`flex ${viewMode === '2col' ? 'flex-col' : 'gap-2 items-center'} ${viewMode === '2col' ? 'gap-2' : ''} ${viewMode === '2col' ? 'mb-2' : 'mb-3'}`}>
                              <select
                                value={selectedMonth}
                                onChange={(e) => {
                                  setSelectedMonth(e.target.value);
                                }}
                                className={`${viewMode === '2col' ? 'w-full text-xs' : 'flex-1 text-base'} px-${viewMode === '2col' ? '2' : '3'} py-${viewMode === '2col' ? '2' : '3'} border-2 border-indigo-500 rounded-lg focus:outline-none font-medium`}
                              >
                                <option value="">Month</option>
                                {viewMode === '2col' ? (
                                  <>
                                    <option value="1">Jan</option>
                                    <option value="2">Feb</option>
                                    <option value="3">Mar</option>
                                    <option value="4">Apr</option>
                                    <option value="5">May</option>
                                    <option value="6">Jun</option>
                                    <option value="7">Jul</option>
                                    <option value="8">Aug</option>
                                    <option value="9">Sep</option>
                                    <option value="10">Oct</option>
                                    <option value="11">Nov</option>
                                    <option value="12">Dec</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                  </>
                                )}
                              </select>
                              <select
                                value={selectedDay}
                                onChange={(e) => {
                                  setSelectedDay(e.target.value);
                                }}
                                className={`${viewMode === '2col' ? 'w-full text-xs' : 'flex-1 text-base'} px-${viewMode === '2col' ? '2' : '3'} py-${viewMode === '2col' ? '2' : '3'} border-2 border-indigo-500 rounded-lg focus:outline-none font-medium`}
                              >
                                <option value="">Day</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </select>
                              {viewMode === '2col' ? (
                                <div className="flex gap-2">
                                  {selectedMonth && selectedDay && (
                                    <button
                                      onClick={() => {
                                        const now = new Date();
                                        const year = now.getFullYear();
                                        const dateStr = `${year}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
                                        handleDateChange(habit.id, dateStr);
                                        // Reset to today but keep picker open
                                        const today = new Date();
                                        setSelectedMonth(String(today.getMonth() + 1));
                                        setSelectedDay(String(today.getDate()));
                                      }}
                                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs"
                                    >
                                      Add
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setShowingDatePicker(null);
                                      setSelectedMonth('');
                                      setSelectedDay('');
                                    }}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {selectedMonth && selectedDay && (
                                    <button
                                      onClick={() => {
                                        const now = new Date();
                                        const year = now.getFullYear();
                                        const dateStr = `${year}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
                                        handleDateChange(habit.id, dateStr);
                                        // Reset to today but keep picker open
                                        const today = new Date();
                                        setSelectedMonth(String(today.getMonth() + 1));
                                        setSelectedDay(String(today.getDate()));
                                      }}
                                      className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold"
                                    >
                                      Add
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setShowingDatePicker(null);
                                      setSelectedMonth('');
                                      setSelectedDay('');
                                    }}
                                    className="px-3 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          <div className={`flex flex-wrap ${viewMode === '2col' ? 'gap-1' : 'gap-2'}`}>
                            {(viewMode === '2col' ? habit.dates.slice(0, 6) : habit.dates).map((date, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center ${viewMode === '2col' ? 'gap-1 px-2 py-1 border text-xs' : 'gap-2 px-3 py-2 border-2 text-sm'} bg-white border-gray-200 rounded${viewMode === '2col' ? '' : '-lg'}`}
                              >
                                <span className="font-medium text-gray-700">{formatDate(date)}</span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteDate(habit.id, date);
                                  }}
                                  className={`text-red-500 hover:text-red-700 font-bold ${viewMode === '2col' ? 'text-sm' : 'text-lg'} leading-none`}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {viewMode === '2col' && habit.dates.length > 6 && (
                              <div className="px-2 py-1 text-gray-500 text-xs">
                                +{habit.dates.length - 6} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {isReorderMode && (
                  <div className={`bg-gray-50 ${viewMode === '2col' ? 'px-3 py-2' : 'px-6 py-3'} flex justify-between items-center border-t border-gray-200`}>
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button
                          onClick={() => moveHabitUp(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95 font-bold"
                        >
                          ↑
                        </button>
                      )}
                      {index < habits.length - 1 && (
                        <button
                          onClick={() => moveHabitDown(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95 font-bold"
                        >
                          ↓
                        </button>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteHabit(habit.id);
                      }}
                      className={`text-red-600 hover:text-red-700 ${viewMode === '2col' ? 'text-xs' : 'text-sm'} font-medium active:scale-95`}
                    >
                      Delete
                    </button>
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
