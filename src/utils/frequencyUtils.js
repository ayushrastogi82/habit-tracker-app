// Frequency-based calculations (daily, weekly, monthly)
import { formatDate, parseDate, today } from './dateUtils.js';

// Check if habit should be shown as "done" for a given date
export const isHabitDoneOnDate = (habitId, dateStr, logs) => {
  return logs[dateStr]?.includes(habitId) ?? false;
};

// Get logged dates in current week for a habit
export const getWeeklyLogged = (habitId, logs) => {
  const todayStr = today();
  const weekStart = getStartOfWeek(todayStr);

  return Object.keys(logs)
    .filter((date) => date >= weekStart && date <= todayStr && logs[date].includes(habitId))
    .sort()
    .reverse();
};

// Get logged dates in current month for a habit
export const getMonthlyLogged = (habitId, logs) => {
  const todayStr = today();
  const monthStart = getStartOfMonth(todayStr);

  return Object.keys(logs)
    .filter((date) => date >= monthStart && date <= todayStr && logs[date].includes(habitId))
    .sort()
    .reverse();
};

// Check if weekly target is met for current week
export const isWeeklyTargetMet = (habitId, logs, target) => {
  const weeklyLogged = getWeeklyLogged(habitId, logs);
  return weeklyLogged.length >= target;
};

// Check if monthly target is met for current month
export const isMonthlyTargetMet = (habitId, logs) => {
  const monthlyLogged = getMonthlyLogged(habitId, logs);
  return monthlyLogged.length > 0;
};

// Get progress for weekly habit: (done, target)
export const getWeeklyProgress = (habitId, logs, target) => {
  const logged = getWeeklyLogged(habitId, logs);
  return { done: logged.length, target };
};

// Get progress for monthly habit: (done, target)
export const getMonthlyProgress = (habitId, logs) => {
  const logged = getMonthlyLogged(habitId, logs);
  return { done: logged.length > 0 ? 1 : 0, target: 1 };
};

// Format frequency for display: "3x week", "weekly", "daily", "monthly"
export const formatFrequency = (frequency, frequencyTarget) => {
  if (frequency === 'daily') return 'daily';
  if (frequency === 'weekly') {
    if (!frequencyTarget || frequencyTarget === 1) return 'weekly';
    return `${frequencyTarget}x week`;
  }
  if (frequency === 'monthly') return 'monthly';
  return frequency;
};

// Get frequency display with progress: "3x week · 2 of 3 done"
export const getFrequencyWithProgress = (frequency, frequencyTarget, logs, habitId) => {
  const freq = formatFrequency(frequency, frequencyTarget);

  if (frequency === 'daily') {
    return freq;
  }

  if (frequency === 'weekly') {
    const progress = getWeeklyProgress(habitId, logs, frequencyTarget);
    return `${freq} · ${progress.done} of ${progress.target} done`;
  }

  if (frequency === 'monthly') {
    const progress = getMonthlyProgress(habitId, logs);
    return `${freq} · ${progress.done > 0 ? 'done' : 'not done'} this month`;
  }

  return freq;
};

// Get all dates for a month (for heatmap)
export const getDatesInMonth = (dateStr) => {
  const date = parseDate(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const dates = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(d));
  }

  return dates;
};

// Get heatmap data for a month
export const getMonthHeatmapData = (habitId, logs, dateStr) => {
  const dates = getDatesInMonth(dateStr);
  const todayStr = today();

  return dates.map((date) => {
    if (date > todayStr) {
      return { date, level: 'future' };
    }

    const isLogged = logs[date]?.includes(habitId) ?? false;
    if (isLogged) {
      return { date, level: 'full' };
    }

    return { date, level: 'empty' };
  });
};

// Get heatmap data for multiple months
export const getMultiMonthHeatmapData = (habitId, logs, numMonths = 3) => {
  const months = [];
  const todayStr = today();
  const currentDate = parseDate(todayStr);

  for (let i = numMonths - 1; i >= 0; i--) {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthStr = formatDate(monthDate);
    months.push({
      month: monthStr,
      data: getMonthHeatmapData(habitId, logs, monthStr)
    });
  }

  return months;
};

// Get last 7 days of logged data
export const getLast7DaysData = (habitId, logs) => {
  const todayStr = today();
  const dates = [];

  for (let i = 6; i >= 0; i--) {
    const dateStr = addDays(todayStr, -i);
    const isLogged = logs[dateStr]?.includes(habitId) ?? false;
    dates.push({ date: dateStr, logged: isLogged });
  }

  return dates;
};

// Helper: Add days to a date string
function addDays(dateStr, days) {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

// Helper: Get start of week (Sunday)
function getStartOfWeek(dateStr) {
  const date = parseDate(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  return formatDate(sunday);
}

// Helper: Get start of month
function getStartOfMonth(dateStr) {
  const date = parseDate(dateStr);
  return formatDate(new Date(date.getFullYear(), date.getMonth(), 1));
}
