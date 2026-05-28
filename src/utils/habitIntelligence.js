/**
 * Beacon Intelligence — Contextual Smart Focus + Ordering
 *
 * All pure functions. No React, no side effects, no saveHabits() calls.
 * These are display-time calculations only.
 */

// ─── Time Windows ────────────────────────────────────────────────────────────

const WINDOWS = {
  earlyMorning: { label: 'Early morning habit', emoji: '🌅', hours: [5, 6, 7] },
  morning:      { label: 'Morning habit',       emoji: '☀️',  hours: [8, 9, 10, 11] },
  afternoon:    { label: 'Afternoon habit',     emoji: '🌤',  hours: [12, 13, 14, 15, 16] },
  evening:      { label: 'Evening habit',       emoji: '🌆',  hours: [17, 18, 19, 20] },
  night:        { label: 'Night habit',         emoji: '🌙',  hours: [21, 22, 23] },
};

const hourToWindow = (hour) => {
  for (const [key, win] of Object.entries(WINDOWS)) {
    if (win.hours.includes(hour)) return key;
  }
  return null; // 0-4am = deep night, no pattern
};

const currentHour = () => new Date().getHours();

// ─── Pattern Detection ────────────────────────────────────────────────────────

/**
 * Analyzes a habit's logTimes to detect a consistent time window pattern.
 * @param {object} habit
 * @returns {{ windowKey, windowLabel, windowEmoji, confidence, dataPoints } | null}
 */
export function detectHabitWindow(habit) {
  const logTimes = habit.logTimes;
  if (!logTimes) return null;

  // Use last 30 entries, sorted newest first
  const timestamps = Object.values(logTimes)
    .sort((a, b) => b - a)
    .slice(0, 30);

  if (timestamps.length < 3) return null;

  // Count hits per window
  const counts = {};
  let mapped = 0;
  for (const ts of timestamps) {
    const hour = new Date(ts).getHours();
    const key = hourToWindow(hour);
    if (key) {
      counts[key] = (counts[key] || 0) + 1;
      mapped++;
    }
  }

  if (mapped < 3) return null;

  // Find dominant window
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!dominant) return null;

  const [windowKey, count] = dominant;
  const confidence = count / mapped;

  if (confidence < 0.60) return null;

  return {
    windowKey,
    windowLabel: WINDOWS[windowKey].label,
    windowEmoji: WINDOWS[windowKey].emoji,
    confidence,
    dataPoints: mapped,
  };
}

/**
 * Returns whether the current time falls within a given window.
 */
export function isCurrentlyInWindow(windowKey) {
  const win = WINDOWS[windowKey];
  if (!win) return false;
  return win.hours.includes(currentHour());
}

// ─── Confidence Level (Gradual Activation) ────────────────────────────────────

/**
 * Maps pattern confidence + session count to a UI confidence level.
 * The system earns its authority gradually — first 7 sessions are silent.
 *
 * @param {object} habit
 * @param {number} sessionCount
 * @returns {'none' | 'low' | 'high' | 'very_high'}
 */
export function getConfidenceLevel(habit, sessionCount) {
  const pattern = detectHabitWindow(habit);
  if (!pattern) return 'none';
  if (!isCurrentlyInWindow(pattern.windowKey)) return 'none';

  const { confidence } = pattern;

  // Sessions 1-7: always silent regardless of data
  if (sessionCount <= 7) return 'none';

  // Sessions 8-14: max 'low'
  if (sessionCount <= 14) {
    return confidence >= 0.60 ? 'low' : 'none';
  }

  // Sessions 15-21: max 'high'
  if (sessionCount <= 21) {
    if (confidence >= 0.75) return 'high';
    if (confidence >= 0.60) return 'low';
    return 'none';
  }

  // Sessions 22+: full range
  if (confidence >= 0.88) return 'very_high';
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.60) return 'low';
  return 'none';
}

// ─── Comeback Detection ───────────────────────────────────────────────────────

/**
 * Returns true if the user hasn't logged anything in 3+ days.
 * In comeback state, always show full dashboard (never prediction).
 */
export function isComebackState(habits) {
  const allTimestamps = habits.flatMap(h =>
    h.logTimes ? Object.values(h.logTimes) : []
  );
  if (allTimestamps.length === 0) return false; // new user, not a comeback
  const mostRecent = Math.max(...allTimestamps);
  return Date.now() - mostRecent > 3 * 24 * 60 * 60 * 1000;
}

// ─── Focus Habit ─────────────────────────────────────────────────────────────

/**
 * Finds the single best unlogged habit matching the current time window.
 * Returns null if: comeback state, no match, or confidence = 'none'.
 *
 * @param {object[]} habits
 * @param {string} todayStr  'YYYY-MM-DD'
 * @param {number} sessionCount
 * @returns {{ habit, pattern, confidenceLevel } | null}
 */
export function getFocusHabit(habits, todayStr, sessionCount) {
  // Never predict during comeback state
  if (isComebackState(habits)) return null;

  let best = null;
  let bestConfidence = 0;

  for (const habit of habits) {
    // Skip already-logged-today habits
    if (habit.dates.includes(todayStr)) continue;

    const confidenceLevel = getConfidenceLevel(habit, sessionCount);
    if (confidenceLevel === 'none') continue;

    const pattern = detectHabitWindow(habit);
    if (!pattern) continue;

    // Tie-break: pick highest confidence %
    if (pattern.confidence > bestConfidence) {
      best = { habit, pattern, confidenceLevel };
      bestConfidence = pattern.confidence;
    }
  }

  return best;
}

// ─── Predicted Habits (Tinder Stack) ─────────────────────────────────────────

/**
 * Returns ALL unlogged habits with high/very_high confidence for the current window.
 * Sorted by confidence % descending — most certain first.
 * Returns [] if comeback state, no matches, or session count too low.
 *
 * @param {object[]} habits
 * @param {string} todayStr
 * @param {number} sessionCount
 * @returns {{ habit, pattern, confidenceLevel }[]}
 */
export function getPredictedHabits(habits, todayStr, sessionCount) {
  if (isComebackState(habits)) return [];

  return habits
    .filter(h => !h.dates.includes(todayStr))
    .map(h => {
      const level = getConfidenceLevel(h, sessionCount);
      if (level === 'none' || level === 'low') return null; // low = soft float only, no tinder
      const pattern = detectHabitWindow(h);
      if (!pattern || !isCurrentlyInWindow(pattern.windowKey)) return null;
      return { habit: h, pattern, confidenceLevel: level };
    })
    .filter(Boolean)
    .sort((a, b) => b.pattern.confidence - a.pattern.confidence);
}

// ─── Display List Builder ────────────────────────────────────────────────────

/**
 * Builds a display-time sorted list of habits.
 * Does NOT call saveHabits() — pure sorting, storage order preserved within groups.
 *
 * Sort order:
 * 1. Unlogged + current-window pattern match
 * 2. Unlogged (no pattern match or wrong window)
 * 3. Logged today
 *
 * @param {object[]} habits
 * @param {string} todayStr
 * @param {string|null} sinkingHabitId — if set, treat that habit as unlogged for sort purposes
 *   (keeps it in place during the sinking animation even though it's already saved as logged)
 * @returns {{ habit, originalIndex, isLogged, isPatternMatch, pattern }[]}
 */
export function buildDisplayList(habits, todayStr, sinkingHabitId = null) {
  const items = habits.map((habit, originalIndex) => {
    // If this habit is mid-animation, treat as unlogged for sort purposes only.
    // The card itself will render with the logged visual state.
    const isLogged = habit.dates.includes(todayStr) && habit.id !== sinkingHabitId;
    const pattern = detectHabitWindow(habit);
    const isPatternMatch = pattern ? isCurrentlyInWindow(pattern.windowKey) : false;
    return { habit, originalIndex, isLogged, isPatternMatch, pattern };
  });

  // Group 1: unlogged + pattern match (current window)
  const group1 = items.filter(i => !i.isLogged && i.isPatternMatch);
  // Group 2: unlogged, no current-window match
  const group2 = items.filter(i => !i.isLogged && !i.isPatternMatch);
  // Group 3: logged today
  const group3 = items.filter(i => i.isLogged);

  return [...group1, ...group2, ...group3];
}

// ─── Contextual Header ────────────────────────────────────────────────────────

/**
 * Returns contextual greeting + badge count for the header subtitle.
 * @param {object[]} habits
 * @param {string} todayStr
 * @param {boolean} isComeback
 * @returns {{ greeting, badge, emoji, allDone, isComeback }}
 */
export function getContextualHeader(habits, todayStr, isComeback) {
  const hour = currentHour();
  const unloggedCount = habits.filter(h => !h.dates.includes(todayStr)).length;
  const allDone = habits.length > 0 && unloggedCount === 0;

  let greeting, emoji;
  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning'; emoji = '☀️';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon'; emoji = '🌤';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good evening'; emoji = '🌆';
  } else {
    greeting = 'Evening catch-up'; emoji = '🌙';
  }

  return { greeting, emoji, badge: unloggedCount, allDone, isComeback };
}
