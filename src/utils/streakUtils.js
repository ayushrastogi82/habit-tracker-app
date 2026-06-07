// Streak, "on a run", and away calculations — locked run model v1.0
import { today, formatDate } from './dateUtils.js';

// ── Tunable parameters (change here; logic requires no other edits) ────────────
export const RUN_CONFIG = {
  // After REST_COOLDOWN logged days of showing up, the run has a single rest
  // cushion available. Using it resets the counter — must re-earn over the next
  // REST_COOLDOWN days before the cushion is available again.
  REST_COOLDOWN: 14,

  // How many off-days the cushion absorbs at once. Locked at 1 — this is a
  // standing cushion, not a stockpile. Never expose a counter to the user.
  REST_CUSHION: 1,

  // Missed completed days before a single gentle nudge fires (future use).
  NUDGE_AFTER_DAYS: 3,
};

// DST-safe calendar day difference (positive integer, d2 - d1)
const calDaysBetween = (d1Str, d2Str) => {
  const d1 = new Date(d1Str + 'T12:00:00');
  const d2 = new Date(d2Str + 'T12:00:00');
  return Math.round((d2 - d1) / 86400000);
};

// DST-safe date + n days (noon-anchored, avoids spring-forward edge)
const addDaysTo = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
};

// ── Welcome-back copy tiers (B6) ───────────────────────────────────────────────
// missedCompletedDays = fully-ended days since last log, today excluded.
// Returns null for 0–1 days (no away message — card looks normal).
export const getWelcomeBackCopy = (missedCompletedDays) => {
  if (missedCompletedDays <= 1) return null;
  if (missedCompletedDays <= 4)  return 'Welcome back.';
  if (missedCompletedDays <= 14) return "It's still here. Pick up where you left off.";
  return "Glad you're back. Day one counts as much as day one hundred.";
};

// ── Core run state (daily habits) ─────────────────────────────────────────────
// Deterministic from log history — no extra storage needed.
//
// Rest-day cushion (B3):
//   The cushion is a standing single-day buffer, NOT a stockpile.
//   It becomes available after REST_COOLDOWN (14) logged days.
//   Using it resets the counter to 0 — must re-earn over the next 14 logged days.
//   A user can rest roughly once per two weeks, never more often.
//
// Today boundary: today is never counted as a missed day — it is still in progress.
//   missedCompletedDays = days in (lastLog, today) that have fully ended unlogged.
//
// restDayDates: Set of date strings where the cushion absorbed a miss.
//   Used by the grid and mini bar to render the distinct "rest day" cell (B7).
export const computeRunState = (habitId, logs) => {
  const todayStr = today();
  const { REST_COOLDOWN } = RUN_CONFIG;

  const allDates = Object.keys(logs)
    .filter(d => (logs[d] || []).includes(habitId))
    .sort();

  const totalEver = allDates.length;

  if (totalEver === 0) {
    return {
      currentRun: 0, bestRun: 0, totalEver: 0,
      loggedSinceCushion: 0, missedCompletedDays: 0,
      restDayDates: new Set(),
    };
  }

  // loggedSinceCushion: logged days since the cushion was last available or used.
  // Cushion is available when loggedSinceCushion >= REST_COOLDOWN.
  // Resets to 0 on use OR on a true break (new run starts from 0).
  let loggedSinceCushion = 0;
  let currentRun  = 0;
  let bestRun     = 0;
  const restDayDates = new Set();

  for (let i = 0; i < allDates.length; i++) {
    if (i > 0) {
      // Days in the open interval between consecutive logs (neither endpoint counted)
      const gap = calDaysBetween(allDates[i - 1], allDates[i]) - 1;
      if (gap > 0) {
        for (let m = 0; m < gap; m++) {
          if (loggedSinceCushion >= REST_COOLDOWN) {
            // Cushion available — absorb this ONE miss and reset.
            // After reset, loggedSinceCushion = 0 < REST_COOLDOWN, so any further
            // miss in this same gap will find no cushion and break the run.
            loggedSinceCushion = 0;
            restDayDates.add(addDaysTo(allDates[i - 1], m + 1));
          } else {
            // No cushion — true break. allDates[i] starts a fresh run below.
            bestRun = Math.max(bestRun, currentRun);
            currentRun = 0;
            loggedSinceCushion = 0;
            break;
          }
        }
      }
    }

    // Count this logged day and advance the cushion-earn counter.
    currentRun += 1;
    loggedSinceCushion += 1;
  }

  // ── Open gap since last log ────────────────────────────────────────────────
  // Only days that have FULLY ENDED are counted (today is still in progress).
  // daysSince = 1 if logged yesterday (0 completed gap), 2 if missed yesterday (1), etc.
  const lastLogDate = allDates[allDates.length - 1];
  const daysSince = calDaysBetween(lastLogDate, todayStr);
  const missedCompletedDays = Math.max(0, daysSince - 1);

  // No transient rest-day message (decided, do not re-add).
  // The run number staying intact + the rest-day cell in the grid/bar are the signals.
  let broken = false;

  for (let m = 0; m < missedCompletedDays; m++) {
    if (loggedSinceCushion >= REST_COOLDOWN) {
      loggedSinceCushion = 0;
      restDayDates.add(addDaysTo(lastLogDate, m + 1));
    } else {
      bestRun = Math.max(bestRun, currentRun);
      currentRun = 0;
      loggedSinceCushion = 0;
      broken = true;
      break;
    }
  }

  bestRun = Math.max(bestRun, currentRun);

  return {
    currentRun,
    bestRun,
    totalEver,
    loggedSinceCushion,
    // 0 when cushion absorbed all misses (run didn't break)
    missedCompletedDays: broken ? missedCompletedDays : 0,
    restDayDates, // Set<string> — every cushion-absorbed date, for grid/bar rendering
  };
};

// ── Public API ────────────────────────────────────────────────────────────────

export const getCurrentRun = (habitId, logs) =>
  computeRunState(habitId, logs).currentRun;

export const getBestRun = (habitId, logs) =>
  computeRunState(habitId, logs).bestRun;

// Completed days (fully ended, today excluded) since last log after a true break.
// Returns 0 when on a run or when the cushion absorbed the miss.
export const getDaysAway = (habitId, logs) =>
  computeRunState(habitId, logs).missedCompletedDays;

// Total days ever logged — never decreases.
export const getTotalDaysLogged = (habitId, logs) =>
  Object.values(logs).filter(dayLogs => dayLogs.includes(habitId)).length;

// Earliest logged date (or today if never logged).
export const getHabitCreatedDate = (habitId, logs) => {
  const dates = Object.keys(logs)
    .filter(date => (logs[date] || []).includes(habitId))
    .sort();
  return dates.length > 0 ? dates[0] : today();
};

// ── Nudge copy (no gap-day counts per A2 voice rules) ─────────────────────────
export const getNudgeCopy = (habitId, logs) => {
  const { currentRun, missedCompletedDays, totalEver } = computeRunState(habitId, logs);
  if (totalEver === 0) return 'Every start begins with showing up.';
  if (currentRun >= 5)  return `${currentRun} days running.`;
  if (missedCompletedDays === 0) return 'Showing up consistently.';
  return getWelcomeBackCopy(missedCompletedDays) ?? "Come back when you're ready.";
};

// ── Comeback status (no day counts) ──────────────────────────────────────────
export const getComebackStatus = (habitId, logs, createdAt) => {
  const { currentRun, missedCompletedDays, totalEver } = computeRunState(habitId, logs);
  if (currentRun > 0 || totalEver === 0) return null;

  const habitStartDate = new Date((createdAt || today()) + 'T00:00:00');
  const daysSinceStart = Math.floor((new Date() - habitStartDate) / 86400000);
  if (daysSinceStart < 5) return null;

  return { message: getWelcomeBackCopy(missedCompletedDays) ?? "Come back when you're ready." };
};

// ── Weekly / monthly target helpers (no cushion for non-daily per B8) ─────────

export const isWeeklyOnTarget = (habitId, logs, weeklyTarget) => {
  const todayStr = today();
  const d = new Date(todayStr + 'T00:00:00');
  const sun = new Date(d);
  sun.setDate(d.getDate() - d.getDay());
  const weekStart = formatDate(sun);

  const count = Object.keys(logs).filter(
    date => (logs[date] || []).includes(habitId) && date >= weekStart && date <= todayStr
  ).length;
  return count >= weeklyTarget;
};

export const isMonthlyOnTarget = (habitId, logs) => {
  const todayStr = today();
  const monthStart = todayStr.substring(0, 7) + '-01';
  return Object.keys(logs).some(
    date => (logs[date] || []).includes(habitId) && date >= monthStart && date <= todayStr
  );
};
