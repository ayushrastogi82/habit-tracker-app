// Local storage utilities with data migration support
import { formatDate } from './dateUtils.js';

const STORAGE_KEYS = {
  userProfile: 'beacon-user-profile',
  habits: 'beacon-habits',
  logs: 'beacon-logs',
  onboardingComplete: 'beacon-onboarding-complete',
  theme: 'beacon-theme',
  progressViewMode: 'beacon-progress-view-mode',
  installPromptSeen: 'beacon-install-prompt-seen'
};

// Old storage keys (for migration)
const OLD_STORAGE_KEYS = {
  habits: 'habits-data'
};

// ── Shared migration helpers ───────────────────────────────────────────────────
// Used by both migrateOldData (localStorage path) and importBackup (file path)
// so the two code paths always produce identical output.

// Normalise a single habit to the current schema, backfilling any missing fields.
const normaliseHabit = (h, today) => {
  const freq = h.frequency || h.type || 'daily'

  // Pick the right target for this frequency type
  let freqTarget = h.frequencyTarget || 1
  if (!h.frequencyTarget) {
    if (freq === 'weekly')  freqTarget = h.weeklyTarget  || 1
    if (freq === 'monthly') freqTarget = h.monthlyTarget || 1
  }

  // Derive createdAt from the earliest logged date when the field is absent
  const earliestDate = (h.dates && h.dates.length > 0)
    ? [...h.dates].sort()[0]   // YYYY-MM-DD strings sort lexicographically = chronologically
    : null

  return {
    id:              h.id         || `habit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name:            h.name       || 'Unnamed habit',
    time:            h.time       || 'anytime',
    frequency:       freq,
    frequencyTarget: freqTarget,
    createdAt:       h.createdAt  || h.startDate || earliestDate || today,
    icon:            h.icon       ?? null,
    color:           h.color      ?? null,
    archived:        h.archived   ?? false,
    archivedAt:      h.archivedAt ?? null,
    restartedAt:     h.restartedAt ?? null,
  }
}

// Convert legacy embedded dates[] arrays into the logs { [date]: [habitId] } dict.
const oldHabitsToLogs = (oldHabits) => {
  const logs = {}
  oldHabits.forEach((habit) => {
    if (habit.dates && Array.isArray(habit.dates)) {
      habit.dates.forEach((dateStr) => {
        if (!logs[dateStr]) logs[dateStr] = []
        if (!logs[dateStr].includes(habit.id)) logs[dateStr].push(habit.id)
      })
    }
  })
  return logs
}

// Return true if any habit in the array has an embedded dates[] with entries
const habitsHaveEmbeddedDates = (habits) =>
  Array.isArray(habits) && habits.some(h => Array.isArray(h.dates) && h.dates.length > 0)

// Check if old data exists (hasn't been migrated yet)
export const hasOldData = () => {
  return localStorage.getItem(OLD_STORAGE_KEYS.habits) !== null && localStorage.getItem(STORAGE_KEYS.habits) === null;
};

// Migrate old data format to Beacon format
// Uses the same normaliseHabit / oldHabitsToLogs helpers as importBackup
// so the two code paths stay in sync.
export const migrateOldData = () => {
  try {
    const oldDataStr = localStorage.getItem(OLD_STORAGE_KEYS.habits);
    if (!oldDataStr) return null;

    const oldHabits = JSON.parse(oldDataStr);
    const today     = formatDate(new Date());
    const habits    = oldHabits.map(h => normaliseHabit(h, today));
    const logs      = oldHabitsToLogs(oldHabits);

    setHabits(habits);
    setLogs(logs);
    localStorage.removeItem(OLD_STORAGE_KEYS.habits);

    return { habits, logs, migrated: true };
  } catch (error) {
    console.error('Migration error:', error);
    return null;
  }
};

// User profile
export const getUserProfile = () => {
  const data = localStorage.getItem(STORAGE_KEYS.userProfile);
  return data
    ? JSON.parse(data)
    : { name: '' };
};

export const setUserProfile = (profile) => {
  localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(profile));
};

// Habits
export const getHabits = () => {
  const data = localStorage.getItem(STORAGE_KEYS.habits);
  return data ? JSON.parse(data) : [];
};

export const setHabits = (habits) => {
  localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(habits));
};

// Logs
export const getLogs = () => {
  const data = localStorage.getItem(STORAGE_KEYS.logs);
  return data ? JSON.parse(data) : {};
};

export const setLogs = (logs) => {
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
};

// Onboarding
export const getOnboardingComplete = () => {
  return localStorage.getItem(STORAGE_KEYS.onboardingComplete) === 'true';
};

export const setOnboardingComplete = (complete) => {
  localStorage.setItem(STORAGE_KEYS.onboardingComplete, complete ? 'true' : 'false');
};

// Theme
export const getTheme = () => {
  return localStorage.getItem(STORAGE_KEYS.theme) || 'system';
};

export const setTheme = (theme) => {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
};

// Progress view mode
export const getProgressViewMode = () => {
  return localStorage.getItem(STORAGE_KEYS.progressViewMode) || 'simple';
};

export const setProgressViewMode = (mode) => {
  localStorage.setItem(STORAGE_KEYS.progressViewMode, mode);
};

// Install prompt
export const getInstallPromptSeen = () => {
  return localStorage.getItem(STORAGE_KEYS.installPromptSeen) === 'true';
};

export const setInstallPromptSeen = (seen) => {
  localStorage.setItem(STORAGE_KEYS.installPromptSeen, seen ? 'true' : 'false');
};

// Last-seen date — used to compute app-level welcome-back (B6).
// Updated to today each time the app opens. Never used for per-habit logic.
export const getLastSeenDate = () => localStorage.getItem('beacon-last-seen') || null;
export const setLastSeenDate = (date) => localStorage.setItem('beacon-last-seen', date);

// Backup: Export all data as JSON
export const exportBackup = () => {
  const backup = {
    userProfile: getUserProfile(),
    habits: getHabits(),
    logs: getLogs(),
    exportedAt: new Date().toISOString()
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `beacon-backup-${formatDate(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Restore: Import data from JSON backup
// Handles four input shapes:
//   1. Current Beacon format      — { userProfile, habits[], logs{}, exportedAt }
//   2. Old Beacon / partial       — { habits[], logs{} }            (no userProfile)
//   3. Legacy object w/ embedded  — { habits[{ dates[] }], version, preferences }
//                                    (your habit-backup-*.json — NO top-level logs)
//   4. Legacy top-level array     — [ { id, name, dates[], type, ... } ]
export const importBackup = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const raw   = JSON.parse(e.target.result)
        const today = formatDate(new Date())
        let habits, logs, userProfile

        // ── Shape 4: top-level array ─────────────────────────────────────────
        if (Array.isArray(raw)) {
          if (raw.length === 0 || !raw[0].id) throw new Error('Empty or unrecognised array format')
          habits      = raw.map(h => normaliseHabit(h, today))
          logs        = oldHabitsToLogs(raw)
          userProfile = { name: '' }

        // ── Shapes 1 / 2 / 3: object with habits array ───────────────────────
        } else if (raw && Array.isArray(raw.habits)) {
          habits      = raw.habits.map(h => normaliseHabit(h, today))
          userProfile = raw.userProfile || { name: '' }

          // Shape 1/2: separate logs dict already present
          if (raw.logs && Object.keys(raw.logs).length > 0) {
            logs = raw.logs
          // Shape 3: logs embedded inside each habit's dates[] (your old app)
          } else if (habitsHaveEmbeddedDates(raw.habits)) {
            logs = oldHabitsToLogs(raw.habits)
          // Fallback: completions key used by some very early builds
          } else {
            logs = raw.completions || {}
          }

        } else {
          throw new Error(
            'Unrecognised backup format. Expected a Beacon backup JSON or the legacy habits array.'
          )
        }

        setUserProfile(userProfile)
        setHabits(habits)
        setLogs(logs)
        // Mark onboarding done — user already has data, no need to run the flow
        setOnboardingComplete(true)

        resolve({ userProfile, habits, logs })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

// Delete all data
export const deleteAllData = () => {
  localStorage.removeItem(STORAGE_KEYS.userProfile);
  localStorage.removeItem(STORAGE_KEYS.habits);
  localStorage.removeItem(STORAGE_KEYS.logs);
  localStorage.removeItem(STORAGE_KEYS.onboardingComplete);
  localStorage.removeItem(STORAGE_KEYS.theme);
  localStorage.removeItem(STORAGE_KEYS.progressViewMode);
  localStorage.removeItem(STORAGE_KEYS.installPromptSeen);
};

// Initialize app state (with migration if needed)
export const initializeState = () => {
  let migrated = false;

  if (hasOldData()) {
    migrateOldData();
    migrated = true;
  }

  return {
    userProfile: getUserProfile(),
    habits: getHabits(),
    logs: getLogs(),
    onboardingComplete: getOnboardingComplete(),
    theme: getTheme(),
    progressViewMode: getProgressViewMode(),
    installPromptSeen: getInstallPromptSeen(),
    migrated
  };
};
